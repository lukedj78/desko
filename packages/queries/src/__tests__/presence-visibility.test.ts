import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Test di integrazione del filtro privacy presenze (US-5, GDPR).
 *
 * DB reale in-process (PGlite via @desko/db/testing): la semantica di
 * visibleTo() è SQL (EXISTS, OR, join) — mockare la chain Drizzle
 * testerebbe i mock, non il filtro.
 */

// Stato mutabile per impersonare viewer diversi nei singoli test.
const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@desko/auth/server', () => ({
  getCurrentUserId: async () => {
    if (!authState.userId) throw new Error('UNAUTHORIZED');
    return authState.userId;
  },
}));

vi.mock('@desko/db', async () => {
  const { createTestDb } = await import('@desko/db/testing');
  return { db: await createTestDb() };
});

// Import DOPO i mock: le query devono vedere il db PGlite.
import { db } from '@desko/db';
import { follows, presenceEntries, user } from '@desko/db/schema';

import { getPresencesForDate, getPresencesForRange } from '../presence';

const DATE = '2026-06-10';

const USERS = [
  // viewer principale: team Engineering, visibilità company
  { id: 'me', name: 'Marco Bianchi', team: 'Engineering', presenceVisibility: 'company' },
  // stesso team del viewer, visibile solo al team
  { id: 'eng', name: 'Elena Verdi', team: 'Engineering', presenceVisibility: 'team' },
  // visibile solo a chi la segue
  { id: 'fol', name: 'Franca Neri', team: 'Design', presenceVisibility: 'followers' },
  // modalità incognito
  { id: 'hid', name: 'Ugo Rossi', team: 'Engineering', presenceVisibility: 'hidden' },
  // altro team, visibilità company
  { id: 'prod', name: 'Paola Gialli', team: 'Product', presenceVisibility: 'company' },
  // bannato: mai visibile a prescindere dalla visibilità
  { id: 'ban', name: 'Bruno Blu', team: 'Product', presenceVisibility: 'company', banned: true },
] as const;

beforeAll(async () => {
  await db.insert(user).values(
    USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: `${u.id}@desko.test`,
      team: u.team,
      presenceVisibility: u.presenceVisibility,
      banned: 'banned' in u ? u.banned : false,
    })),
  );

  // 'me' segue 'fol' → per 'me' la visibilità followers di fol è soddisfatta
  await db.insert(follows).values({ id: 'f1', followerId: 'me', followedId: 'fol' });

  await db.insert(presenceEntries).values(
    USERS.map((u, i) => ({
      id: `p${i}`,
      userId: u.id,
      date: DATE,
      status: 'in_office' as const,
    })),
  );
});

function visibleIds(entries: Array<{ userId: string }>): string[] {
  return entries.map((e) => e.userId).sort();
}

describe('getPresencesForDate — filtro presenceVisibility', () => {
  it("viewer 'me' (team Engineering, segue fol): vede self, company, team match e followed — mai hidden né banned", async () => {
    authState.userId = 'me';
    const entries = await getPresencesForDate(DATE);
    expect(visibleIds(entries)).toEqual(['eng', 'fol', 'me', 'prod']);
  });

  it("viewer 'prod' (team Product, non segue nessuno): NON vede team Engineering né followers-only", async () => {
    authState.userId = 'prod';
    const entries = await getPresencesForDate(DATE);
    expect(visibleIds(entries)).toEqual(['me', 'prod']);
  });

  it("viewer 'hid' (incognito): vede comunque la propria presenza", async () => {
    authState.userId = 'hid';
    const entries = await getPresencesForDate(DATE);
    expect(visibleIds(entries)).toContain('hid');
    // ...e il resto segue le regole normali: hid è team Engineering,
    // quindi vede anche eng (visibilità team) oltre ai company.
    expect(visibleIds(entries)).toEqual(['eng', 'hid', 'me', 'prod']);
  });

  it("viewer 'fol' (segue nessuno, team Design): vede solo self e company", async () => {
    authState.userId = 'fol';
    const entries = await getPresencesForDate(DATE);
    expect(visibleIds(entries)).toEqual(['fol', 'me', 'prod']);
  });

  it('utente hidden mai visibile ad altri, anche dello stesso team', async () => {
    authState.userId = 'eng'; // stesso team di hid (Engineering)
    const entries = await getPresencesForDate(DATE);
    expect(visibleIds(entries)).not.toContain('hid');
  });
});

describe('getPresencesForRange — stesso filtro sulla griglia mensile', () => {
  it('esclude hidden/banned e rispetta team/followers per il viewer', async () => {
    authState.userId = 'me';
    const days = await getPresencesForRange(DATE, DATE);
    expect(days).toHaveLength(1);
    const attendees = days[0]!.attendees.map((a) => a.userId).sort();
    expect(attendees).toEqual(['eng', 'fol', 'me', 'prod']);
  });

  it("per un viewer di un altro team la stessa griglia mostra meno persone", async () => {
    authState.userId = 'prod';
    const days = await getPresencesForRange(DATE, DATE);
    const attendees = days[0]!.attendees.map((a) => a.userId).sort();
    expect(attendees).toEqual(['me', 'prod']);
  });
});
