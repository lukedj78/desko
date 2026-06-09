import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Test di integrazione dei vincoli di business del dominio lunch:
 * cap partecipanti, 1 proposta/giorno per creator, 1 partecipazione/giorno.
 *
 * DB reale in-process (PGlite via @desko/db/testing) — i vincoli sono
 * implementati con query SQL (count, join), non con logica in-memory.
 */

const authState = vi.hoisted(() => ({ userId: 'alice' }));

vi.mock('@desko/auth/server', () => ({
  getCurrentUserId: async () => authState.userId,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@desko/db', async () => {
  const { createTestDb } = await import('@desko/db/testing');
  return { db: await createTestDb() };
});

// Import DOPO i mock.
import { db } from '@desko/db';
import { restaurants, user } from '@desko/db/schema';

import { createLunchProposal, joinLunchProposal } from '../lunch';

const DATE = '2026-06-11';

function asUser(id: string) {
  authState.userId = id;
}

beforeAll(async () => {
  await db.insert(user).values(
    ['alice', 'bob', 'carol', 'dave'].map((id) => ({
      id,
      name: id,
      email: `${id}@desko.test`,
    })),
  );
  await db.insert(restaurants).values([
    { id: 'r1', name: 'Trattoria Tortona', address: 'Via Tortona 1' },
    { id: 'r2', name: 'Chiuso per ferie', address: 'Via Chiusa 2', isArchived: true },
  ]);
});

describe('createLunchProposal — vincoli', () => {
  it('crea una proposta valida e auto-aggiunge il creator come partecipante', async () => {
    asUser('alice');
    const res = await createLunchProposal({
      restaurantId: 'r1',
      date: DATE,
      meetingTime: '12:45',
      visibility: 'public',
      maxParticipants: 2,
    });
    expect(res.ok).toBe(true);
  });

  it('rifiuta una seconda proposta open dello stesso creator per la stessa data', async () => {
    asUser('alice');
    const res = await createLunchProposal({
      restaurantId: 'r1',
      date: DATE,
      meetingTime: '13:00',
      visibility: 'public',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/già una proposta attiva/i);
  });

  it('rifiuta un ristorante archiviato', async () => {
    asUser('bob');
    const res = await createLunchProposal({
      restaurantId: 'r2',
      date: DATE,
      meetingTime: '12:30',
      visibility: 'public',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/non più disponibile/i);
  });

  it('rifiuta un ristorante inesistente', async () => {
    asUser('bob');
    const res = await createLunchProposal({
      restaurantId: 'r-ghost',
      date: DATE,
      meetingTime: '12:30',
      visibility: 'public',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/non trovato/i);
  });
});

describe('joinLunchProposal — cap partecipanti e vincolo 1/giorno', () => {
  let proposalId: string;

  beforeAll(async () => {
    // Recupera l'id della proposta di alice (cap = 2, alice già dentro)
    const rows = await db.query.lunchProposals.findMany();
    proposalId = rows[0]!.id;
  });

  it('bob entra finché ci sono posti', async () => {
    asUser('bob');
    const res = await joinLunchProposal({ proposalId });
    expect(res.ok).toBe(true);
  });

  it('carol viene rifiutata a cap raggiunto (2/2)', async () => {
    asUser('carol');
    const res = await joinLunchProposal({ proposalId });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/posti esauriti/i);
  });

  it('bob non può iscriversi a un secondo pranzo nella stessa data', async () => {
    // dave crea una seconda proposta per la stessa data (senza cap)
    asUser('dave');
    const created = await createLunchProposal({
      restaurantId: 'r1',
      date: DATE,
      meetingTime: '13:15',
      visibility: 'public',
    });
    expect(created.ok).toBe(true);
    const daveProposalId = created.ok ? created.data.proposalId : '';

    asUser('bob'); // bob è già nel pranzo di alice per DATE
    const res = await joinLunchProposal({ proposalId: daveProposalId });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/già iscritto/i);
  });

  it('proposta inesistente → errore esplicito', async () => {
    asUser('carol');
    const res = await joinLunchProposal({ proposalId: 'nope' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/non trovata/i);
  });
});
