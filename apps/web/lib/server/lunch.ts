'use server';

import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUserId } from '@/lib/auth-server';
import { db } from '@/lib/db';
import {
  lunchProposalInvites,
  lunchProposalParticipants,
  lunchProposals,
  restaurantRatings,
  restaurants,
  user as userTable,
} from '@/lib/db/schema';
import type { ActionResult } from '@/lib/presence-domain';

/**
 * Server actions per il dominio "lunch" (pausa pranzo).
 *
 * Convenzioni:
 *   - Mai THROW oltre il confine server: ritorna sempre `ActionResult<T>`.
 *   - Validazione Zod, errori formattati con `flattenZod()`.
 *   - `revalidatePath('/lunch')` (e altre) su ogni mutation.
 *   - Vincoli "soft" (1 proposta open per giorno per utente, etc.) validati qui,
 *     non a livello DB (così l'utente vede un messaggio user-friendly).
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flattenZod(
  error: z.ZodError,
): { message: string; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return {
    message: 'Validazione fallita: controlla i campi evidenziati.',
    fieldErrors,
  };
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const cuisineEnum = z.enum([
  'italian',
  'pizza',
  'sushi',
  'asian',
  'salad',
  'burger',
  'bistro',
  'bakery',
  'fusion',
  'other',
]);
const priceRangeEnum = z.enum(['€', '€€', '€€€']);

// ─── Restaurants ─────────────────────────────────────────────────────────────

const addRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Nome troppo corto').max(80),
  cuisine: cuisineEnum,
  priceRange: priceRangeEnum,
  address: z.string().trim().min(3, 'Indirizzo richiesto').max(200),
  emoji: z.string().trim().max(4).optional(),
  description: z.string().trim().max(280).optional(),
  mapsUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//.test(v), 'URL non valido')
    .optional(),
});

export async function addRestaurant(
  input: z.infer<typeof addRestaurantSchema>,
): Promise<ActionResult<{ restaurantId: string }>> {
  const myUserId = await getCurrentUserId();
  const parsed = addRestaurantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  // Anti-duplicati: skip se esiste già stesso nome+indirizzo (case-insensitive
  // semplice via lower)
  const dup = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(
      and(
        eq(restaurants.name, parsed.data.name),
        eq(restaurants.address, parsed.data.address),
      ),
    )
    .limit(1);
  if (dup.length > 0 && dup[0]) {
    return { ok: true, data: { restaurantId: dup[0].id } };
  }

  const id = randomUUID();
  await db.insert(restaurants).values({
    id,
    name: parsed.data.name,
    cuisine: parsed.data.cuisine,
    priceRange: parsed.data.priceRange,
    address: parsed.data.address,
    emoji: parsed.data.emoji || null,
    description: parsed.data.description || null,
    mapsUrl: parsed.data.mapsUrl || null,
    createdBy: myUserId,
  });

  revalidatePath('/lunch');
  return { ok: true, data: { restaurantId: id } };
}

const rateRestaurantSchema = z.object({
  restaurantId: z.string().min(1),
  score: z.number().int().min(1).max(5),
});

export async function rateRestaurant(
  input: z.infer<typeof rateRestaurantSchema>,
): Promise<ActionResult> {
  const myUserId = await getCurrentUserId();
  const parsed = rateRestaurantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  // Upsert: aggiorna se esiste, inserisci altrimenti
  const existing = await db
    .select()
    .from(restaurantRatings)
    .where(
      and(
        eq(restaurantRatings.restaurantId, parsed.data.restaurantId),
        eq(restaurantRatings.userId, myUserId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(restaurantRatings)
      .set({ score: parsed.data.score, updatedAt: new Date() })
      .where(
        and(
          eq(restaurantRatings.restaurantId, parsed.data.restaurantId),
          eq(restaurantRatings.userId, myUserId),
        ),
      );
  } else {
    await db.insert(restaurantRatings).values({
      restaurantId: parsed.data.restaurantId,
      userId: myUserId,
      score: parsed.data.score,
    });
  }

  revalidatePath('/lunch');
  return { ok: true, data: undefined };
}

// ─── Proposals ───────────────────────────────────────────────────────────────

const createProposalSchema = z.object({
  restaurantId: z.string().min(1, 'Scegli un ristorante'),
  date: z.string().regex(dateRegex, 'Data non valida'),
  meetingTime: z.string().regex(timeRegex, 'Orario non valido (HH:MM)'),
  visibility: z.enum(['public', 'private']),
  note: z.string().trim().max(280).optional(),
  maxParticipants: z.number().int().min(2).max(50).optional().nullable(),
  inviteUserIds: z.array(z.string()).optional(), // solo per private
});

export async function createLunchProposal(
  input: z.infer<typeof createProposalSchema>,
): Promise<ActionResult<{ proposalId: string }>> {
  const myUserId = await getCurrentUserId();
  const parsed = createProposalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };
  const { restaurantId, date, meetingTime, visibility, note, maxParticipants, inviteUserIds } =
    parsed.data;

  // 1. Vincolo soft: 1 proposta `open` per (creator, date)
  const dup = await db
    .select({ id: lunchProposals.id })
    .from(lunchProposals)
    .where(
      and(
        eq(lunchProposals.createdBy, myUserId),
        eq(lunchProposals.date, date),
        eq(lunchProposals.status, 'open'),
      ),
    )
    .limit(1);
  if (dup.length > 0) {
    return {
      ok: false,
      message: 'Hai già una proposta attiva per questa data. Cancella la precedente o modifica quella.',
    };
  }

  // 2. Vincolo soft: ristorante esistente e non archiviato
  const rest = await db
    .select({ id: restaurants.id, archived: restaurants.isArchived })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);
  if (rest.length === 0 || !rest[0]) {
    return { ok: false, message: 'Ristorante non trovato.' };
  }
  if (rest[0].archived) {
    return { ok: false, message: 'Ristorante non più disponibile.' };
  }

  const proposalId = randomUUID();
  await db.insert(lunchProposals).values({
    id: proposalId,
    createdBy: myUserId,
    restaurantId,
    date,
    meetingTime,
    visibility,
    note: note || null,
    maxParticipants: maxParticipants ?? null,
  });

  // Creator si auto-aggiunge come partecipante
  await db.insert(lunchProposalParticipants).values({
    proposalId,
    userId: myUserId,
  });

  // Inviti per la privata (validati: utenti esistenti, non bannati, non self)
  if (visibility === 'private' && inviteUserIds && inviteUserIds.length > 0) {
    const validUsers = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.banned, false));
    const validIds = new Set(validUsers.map((u) => u.id));
    const invites = inviteUserIds.filter((id) => id !== myUserId && validIds.has(id));
    if (invites.length > 0) {
      await db.insert(lunchProposalInvites).values(
        invites.map((id) => ({ proposalId, userId: id })),
      );
    }
  }

  revalidatePath('/lunch');
  revalidatePath('/dashboard');
  return { ok: true, data: { proposalId } };
}

const proposalIdSchema = z.object({ proposalId: z.string().min(1) });

export async function joinLunchProposal(
  input: z.infer<typeof proposalIdSchema>,
): Promise<ActionResult> {
  const myUserId = await getCurrentUserId();
  const parsed = proposalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  // 1. Carica la proposta + count partecipanti
  const [proposal] = await db
    .select()
    .from(lunchProposals)
    .where(eq(lunchProposals.id, parsed.data.proposalId))
    .limit(1);
  if (!proposal) return { ok: false, message: 'Proposta non trovata.' };
  if (proposal.status !== 'open') return { ok: false, message: 'Proposta non più aperta.' };

  // 2. Se privata: deve essere creator OR invitato
  if (proposal.visibility === 'private' && proposal.createdBy !== myUserId) {
    const invite = await db
      .select({ proposalId: lunchProposalInvites.proposalId })
      .from(lunchProposalInvites)
      .where(
        and(
          eq(lunchProposalInvites.proposalId, proposal.id),
          eq(lunchProposalInvites.userId, myUserId),
        ),
      )
      .limit(1);
    if (invite.length === 0) {
      return { ok: false, message: 'Non sei invitato a questa proposta.' };
    }
  }

  // 3. Vincolo soft: 1 partecipazione per data
  const sameDate = await db
    .select({ id: lunchProposals.id })
    .from(lunchProposalParticipants)
    .innerJoin(lunchProposals, eq(lunchProposalParticipants.proposalId, lunchProposals.id))
    .where(
      and(
        eq(lunchProposalParticipants.userId, myUserId),
        eq(lunchProposals.date, proposal.date),
        eq(lunchProposals.status, 'open'),
      ),
    )
    .limit(1);
  if (sameDate.length > 0) {
    return {
      ok: false,
      message: 'Sei già iscritto a un altro pranzo per questa data.',
    };
  }

  // 4. Cap partecipanti (se settato)
  if (proposal.maxParticipants !== null) {
    const [count] = await db
      .select({
        n: db.$count(lunchProposalParticipants),
      })
      .from(lunchProposalParticipants)
      .where(eq(lunchProposalParticipants.proposalId, proposal.id));
    if (count && count.n >= proposal.maxParticipants) {
      return { ok: false, message: 'Posti esauriti per questa proposta.' };
    }
  }

  await db
    .insert(lunchProposalParticipants)
    .values({ proposalId: proposal.id, userId: myUserId })
    .onConflictDoNothing();

  revalidatePath('/lunch');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function leaveLunchProposal(
  input: z.infer<typeof proposalIdSchema>,
): Promise<ActionResult> {
  const myUserId = await getCurrentUserId();
  const parsed = proposalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  const [proposal] = await db
    .select({ id: lunchProposals.id, createdBy: lunchProposals.createdBy })
    .from(lunchProposals)
    .where(eq(lunchProposals.id, parsed.data.proposalId))
    .limit(1);
  if (!proposal) return { ok: false, message: 'Proposta non trovata.' };
  if (proposal.createdBy === myUserId) {
    return {
      ok: false,
      message: 'Sei il creator: cancella la proposta invece di lasciarla.',
    };
  }

  await db
    .delete(lunchProposalParticipants)
    .where(
      and(
        eq(lunchProposalParticipants.proposalId, parsed.data.proposalId),
        eq(lunchProposalParticipants.userId, myUserId),
      ),
    );

  revalidatePath('/lunch');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function cancelLunchProposal(
  input: z.infer<typeof proposalIdSchema>,
): Promise<ActionResult> {
  const myUserId = await getCurrentUserId();
  const parsed = proposalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  const [proposal] = await db
    .select()
    .from(lunchProposals)
    .where(eq(lunchProposals.id, parsed.data.proposalId))
    .limit(1);
  if (!proposal) return { ok: false, message: 'Proposta non trovata.' };
  if (proposal.createdBy !== myUserId) {
    return { ok: false, message: 'Solo il creator può cancellare la proposta.' };
  }
  if (proposal.status === 'cancelled') {
    return { ok: true, data: undefined };
  }

  await db
    .update(lunchProposals)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(eq(lunchProposals.id, proposal.id));

  revalidatePath('/lunch');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}
