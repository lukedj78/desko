import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@desko/db';
import {
  lunchProposalInvites,
  lunchProposalParticipants,
  lunchProposals,
  restaurantRatings,
  restaurants,
  user as userTable,
} from '@desko/db/schema';
import type { ActionResult } from '@desko/domain';

/**
 * Servizi di dominio "lunch" (pausa pranzo) — logica PURA, senza Next.
 * Stesso pattern di `presence.ts`: identità esplicita, ActionResult sulle
 * mutation, vincoli soft validati qui con messaggi user-friendly.
 *
 * Adapter: `@desko/server-actions/lunch` (web) e `apps/web-shadcn/app/api/lunch/*` (mobile).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Cuisine =
  | 'italian'
  | 'pizza'
  | 'sushi'
  | 'asian'
  | 'salad'
  | 'burger'
  | 'bistro'
  | 'bakery'
  | 'fusion'
  | 'other';
export type PriceRange = '€' | '€€' | '€€€';
export type ProposalVisibility = 'public' | 'private';
export type ProposalStatus = 'open' | 'cancelled';

export type RestaurantWithRating = {
  id: string;
  name: string;
  cuisine: Cuisine;
  priceRange: PriceRange;
  address: string;
  distanceM: number | null;
  description: string | null;
  emoji: string | null;
  mapsUrl: string | null;
  ratingAvg: number; // 0..5
  ratingCount: number;
};

export type ProposalParticipant = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
};

export type ProposalSummary = {
  id: string;
  date: string;
  meetingTime: string;
  visibility: ProposalVisibility;
  status: ProposalStatus;
  note: string | null;
  maxParticipants: number | null;
  createdBy: ProposalParticipant;
  restaurant: RestaurantWithRating;
  participants: ProposalParticipant[];
  iAmCreator: boolean;
  iAmParticipant: boolean;
  iAmInvited: boolean; // true se sono nella lista invitati di una privata
  invitedCount: number; // solo per privata
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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

// ─── Validation schemas ──────────────────────────────────────────────────────

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

const rateRestaurantSchema = z.object({
  restaurantId: z.string().min(1),
  score: z.number().int().min(1).max(5),
});

const createProposalSchema = z.object({
  restaurantId: z.string().min(1, 'Scegli un ristorante'),
  date: z.string().regex(dateRegex, 'Data non valida'),
  meetingTime: z.string().regex(timeRegex, 'Orario non valido (HH:MM)'),
  visibility: z.enum(['public', 'private']),
  note: z.string().trim().max(280).optional(),
  maxParticipants: z.number().int().min(2).max(50).optional().nullable(),
  inviteUserIds: z.array(z.string()).optional(), // solo per private
});

const proposalIdSchema = z.object({ proposalId: z.string().min(1) });

export type AddRestaurantInput = z.infer<typeof addRestaurantSchema>;
export type RateRestaurantInput = z.infer<typeof rateRestaurantSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type ProposalIdInput = z.infer<typeof proposalIdSchema>;

// ─── Reads ───────────────────────────────────────────────────────────────────

/**
 * Lista completa ristoranti attivi, con rating aggregato.
 * Ordine: rating desc, poi nome asc.
 */
export async function getRestaurants(): Promise<RestaurantWithRating[]> {
  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      cuisine: restaurants.cuisine,
      priceRange: restaurants.priceRange,
      address: restaurants.address,
      distanceM: restaurants.distanceM,
      description: restaurants.description,
      emoji: restaurants.emoji,
      mapsUrl: restaurants.mapsUrl,
      ratingAvg: sql<string | null>`AVG(${restaurantRatings.score})::text`,
      ratingCount: sql<number>`COUNT(${restaurantRatings.score})::int`,
    })
    .from(restaurants)
    .leftJoin(restaurantRatings, eq(restaurantRatings.restaurantId, restaurants.id))
    .where(eq(restaurants.isArchived, false))
    .groupBy(restaurants.id)
    .orderBy(desc(sql`AVG(${restaurantRatings.score})`), asc(restaurants.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine as Cuisine,
    priceRange: r.priceRange as PriceRange,
    address: r.address,
    distanceM: r.distanceM,
    description: r.description,
    emoji: r.emoji,
    mapsUrl: r.mapsUrl,
    ratingAvg: r.ratingAvg ? Math.round(parseFloat(r.ratingAvg) * 10) / 10 : 0,
    ratingCount: r.ratingCount,
  }));
}

/** Partecipazioni + info utente per un set di proposte (single round-trip). */
async function loadParticipantsForProposals(
  proposalIds: string[],
): Promise<Map<string, ProposalParticipant[]>> {
  if (proposalIds.length === 0) return new Map();

  const rows = await db
    .select({
      proposalId: lunchProposalParticipants.proposalId,
      userId: lunchProposalParticipants.userId,
      displayName: userTable.name,
      team: userTable.team,
      joinedAt: lunchProposalParticipants.joinedAt,
    })
    .from(lunchProposalParticipants)
    .innerJoin(userTable, eq(lunchProposalParticipants.userId, userTable.id))
    .where(inArray(lunchProposalParticipants.proposalId, proposalIds))
    .orderBy(asc(lunchProposalParticipants.joinedAt));

  const map = new Map<string, ProposalParticipant[]>();
  for (const r of rows) {
    const list = map.get(r.proposalId) ?? [];
    list.push({
      userId: r.userId,
      displayName: r.displayName,
      initials: initialsFromName(r.displayName),
      team: r.team ?? null,
    });
    map.set(r.proposalId, list);
  }
  return map;
}

/** Set di (proposal_id) per cui `userId` è invitato. */
async function loadMyInvitesForProposals(
  userId: string,
  proposalIds: string[],
): Promise<Set<string>> {
  if (proposalIds.length === 0) return new Set();
  const rows = await db
    .select({ proposalId: lunchProposalInvites.proposalId })
    .from(lunchProposalInvites)
    .where(
      and(
        eq(lunchProposalInvites.userId, userId),
        inArray(lunchProposalInvites.proposalId, proposalIds),
      ),
    );
  return new Set(rows.map((r) => r.proposalId));
}

async function loadInviteCounts(proposalIds: string[]): Promise<Map<string, number>> {
  if (proposalIds.length === 0) return new Map();
  const rows = await db
    .select({
      proposalId: lunchProposalInvites.proposalId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(lunchProposalInvites)
    .where(inArray(lunchProposalInvites.proposalId, proposalIds))
    .groupBy(lunchProposalInvites.proposalId);
  return new Map(rows.map((r) => [r.proposalId, r.count]));
}

/**
 * Proposte di pranzo visibili a `userId` per una data (default: oggi).
 *
 * Visibilità:
 *   - 'public': tutti la vedono
 *   - 'private': solo creator + invitati + partecipanti già uniti
 *
 * Restituisce solo proposte in stato 'open'.
 */
export async function getLunchProposalsForDate(
  userId: string,
  date?: string,
): Promise<ProposalSummary[]> {
  const targetDate = date ?? todayIso();

  // 1. Tutte le proposte open per la data + restaurant + creator
  const proposalRows = await db
    .select({
      proposalId: lunchProposals.id,
      proposalDate: lunchProposals.date,
      meetingTime: lunchProposals.meetingTime,
      visibility: lunchProposals.visibility,
      status: lunchProposals.status,
      note: lunchProposals.note,
      maxParticipants: lunchProposals.maxParticipants,
      createdById: lunchProposals.createdBy,
      createdByName: userTable.name,
      createdByTeam: userTable.team,
      restaurantId: restaurants.id,
      restaurantName: restaurants.name,
      restaurantCuisine: restaurants.cuisine,
      restaurantPriceRange: restaurants.priceRange,
      restaurantAddress: restaurants.address,
      restaurantDistanceM: restaurants.distanceM,
      restaurantDescription: restaurants.description,
      restaurantEmoji: restaurants.emoji,
      restaurantMapsUrl: restaurants.mapsUrl,
    })
    .from(lunchProposals)
    .innerJoin(restaurants, eq(lunchProposals.restaurantId, restaurants.id))
    .innerJoin(userTable, eq(lunchProposals.createdBy, userTable.id))
    .where(
      and(
        eq(lunchProposals.date, targetDate),
        eq(lunchProposals.status, 'open'),
        eq(userTable.banned, false),
      ),
    )
    .orderBy(asc(lunchProposals.meetingTime));

  if (proposalRows.length === 0) return [];

  const proposalIds = proposalRows.map((p) => p.proposalId);

  // 2. Partecipanti, inviti, rating ristoranti aggregati
  const [participantsByProposal, myInvites, inviteCounts, ratings] = await Promise.all([
    loadParticipantsForProposals(proposalIds),
    loadMyInvitesForProposals(userId, proposalIds),
    loadInviteCounts(proposalIds),
    db
      .select({
        restaurantId: restaurantRatings.restaurantId,
        avg: sql<string | null>`AVG(${restaurantRatings.score})::text`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(restaurantRatings)
      .where(inArray(restaurantRatings.restaurantId, proposalRows.map((p) => p.restaurantId)))
      .groupBy(restaurantRatings.restaurantId),
  ]);

  const ratingByRest = new Map(
    ratings.map((r) => [
      r.restaurantId,
      {
        avg: r.avg ? Math.round(parseFloat(r.avg) * 10) / 10 : 0,
        count: r.count,
      },
    ]),
  );

  // 3. Filtra: tutte le pubbliche; le private solo se creator/invitato/partecipante
  const result: ProposalSummary[] = [];
  for (const p of proposalRows) {
    const participants = participantsByProposal.get(p.proposalId) ?? [];
    const iAmCreator = p.createdById === userId;
    const iAmParticipant = participants.some((x) => x.userId === userId);
    const iAmInvited = myInvites.has(p.proposalId);

    if (p.visibility === 'private' && !iAmCreator && !iAmParticipant && !iAmInvited) {
      continue;
    }

    const rating = ratingByRest.get(p.restaurantId) ?? { avg: 0, count: 0 };

    result.push({
      id: p.proposalId,
      date: p.proposalDate,
      meetingTime: p.meetingTime,
      visibility: p.visibility as ProposalVisibility,
      status: p.status as ProposalStatus,
      note: p.note,
      maxParticipants: p.maxParticipants,
      createdBy: {
        userId: p.createdById,
        displayName: p.createdByName,
        initials: initialsFromName(p.createdByName),
        team: p.createdByTeam ?? null,
      },
      restaurant: {
        id: p.restaurantId,
        name: p.restaurantName,
        cuisine: p.restaurantCuisine as Cuisine,
        priceRange: p.restaurantPriceRange as PriceRange,
        address: p.restaurantAddress,
        distanceM: p.restaurantDistanceM,
        description: p.restaurantDescription,
        emoji: p.restaurantEmoji,
        mapsUrl: p.restaurantMapsUrl,
        ratingAvg: rating.avg,
        ratingCount: rating.count,
      },
      participants,
      iAmCreator,
      iAmParticipant,
      iAmInvited,
      invitedCount: inviteCounts.get(p.proposalId) ?? 0,
    });
  }

  return result;
}

/** Proposte create da `userId` (per la vista "Mie proposte"). */
export async function getMyLunchProposals(userId: string): Promise<ProposalSummary[]> {
  const rows = await db
    .select({ id: lunchProposals.id, date: lunchProposals.date })
    .from(lunchProposals)
    .where(eq(lunchProposals.createdBy, userId))
    .orderBy(desc(lunchProposals.date), desc(lunchProposals.meetingTime));

  // Per ogni data unica riusa la query base (in genere poche date).
  const dates = Array.from(new Set(rows.map((r) => r.date)));
  const all: ProposalSummary[] = [];
  for (const d of dates) {
    const proposals = await getLunchProposalsForDate(userId, d);
    for (const p of proposals) {
      if (p.createdBy.userId === userId) all.push(p);
    }
  }
  return all;
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function addRestaurant(
  userId: string,
  input: AddRestaurantInput,
): Promise<ActionResult<{ restaurantId: string }>> {
  const parsed = addRestaurantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  // Anti-duplicati: skip se esiste già stesso nome+indirizzo
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
    createdBy: userId,
  });

  return { ok: true, data: { restaurantId: id } };
}

export async function rateRestaurant(
  userId: string,
  input: RateRestaurantInput,
): Promise<ActionResult> {
  const parsed = rateRestaurantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  const existing = await db
    .select()
    .from(restaurantRatings)
    .where(
      and(
        eq(restaurantRatings.restaurantId, parsed.data.restaurantId),
        eq(restaurantRatings.userId, userId),
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
          eq(restaurantRatings.userId, userId),
        ),
      );
  } else {
    await db.insert(restaurantRatings).values({
      restaurantId: parsed.data.restaurantId,
      userId,
      score: parsed.data.score,
    });
  }

  return { ok: true, data: undefined };
}

/**
 * Crea una proposta di pranzo. Vincoli soft:
 * 1 proposta open per (creator, date); ristorante esistente e non archiviato.
 * Il creator si auto-aggiunge come partecipante. Per le private, valida gli inviti.
 *
 * Ritorna anche `invitedUserIds` (validati) così l'adapter può notificare.
 */
export async function createLunchProposal(
  userId: string,
  input: CreateProposalInput,
): Promise<ActionResult<{ proposalId: string; invitedUserIds: string[] }>> {
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
        eq(lunchProposals.createdBy, userId),
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
    createdBy: userId,
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
    userId,
  });

  // Inviti per la privata (validati: utenti esistenti, non bannati, non self)
  let invites: string[] = [];
  if (visibility === 'private' && inviteUserIds && inviteUserIds.length > 0) {
    const validUsers = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.banned, false));
    const validIds = new Set(validUsers.map((u) => u.id));
    invites = inviteUserIds.filter((id) => id !== userId && validIds.has(id));
    if (invites.length > 0) {
      await db.insert(lunchProposalInvites).values(
        invites.map((id) => ({ proposalId, userId: id })),
      );
    }
  }

  return { ok: true, data: { proposalId, invitedUserIds: invites } };
}

/**
 * Unisciti a una proposta. Vincoli: open, invito per le private,
 * 1 partecipazione per data, cap partecipanti.
 */
export async function joinLunchProposal(
  userId: string,
  input: ProposalIdInput,
): Promise<ActionResult> {
  const parsed = proposalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  // 1. Carica la proposta
  const [proposal] = await db
    .select()
    .from(lunchProposals)
    .where(eq(lunchProposals.id, parsed.data.proposalId))
    .limit(1);
  if (!proposal) return { ok: false, message: 'Proposta non trovata.' };
  if (proposal.status !== 'open') return { ok: false, message: 'Proposta non più aperta.' };

  // 2. Se privata: deve essere creator OR invitato
  if (proposal.visibility === 'private' && proposal.createdBy !== userId) {
    const invite = await db
      .select({ proposalId: lunchProposalInvites.proposalId })
      .from(lunchProposalInvites)
      .where(
        and(
          eq(lunchProposalInvites.proposalId, proposal.id),
          eq(lunchProposalInvites.userId, userId),
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
        eq(lunchProposalParticipants.userId, userId),
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
    .values({ proposalId: proposal.id, userId })
    .onConflictDoNothing();

  return { ok: true, data: undefined };
}

export async function leaveLunchProposal(
  userId: string,
  input: ProposalIdInput,
): Promise<ActionResult> {
  const parsed = proposalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  const [proposal] = await db
    .select({ id: lunchProposals.id, createdBy: lunchProposals.createdBy })
    .from(lunchProposals)
    .where(eq(lunchProposals.id, parsed.data.proposalId))
    .limit(1);
  if (!proposal) return { ok: false, message: 'Proposta non trovata.' };
  if (proposal.createdBy === userId) {
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
        eq(lunchProposalParticipants.userId, userId),
      ),
    );

  return { ok: true, data: undefined };
}

export async function cancelLunchProposal(
  userId: string,
  input: ProposalIdInput,
): Promise<ActionResult> {
  const parsed = proposalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...flattenZod(parsed.error) };

  const [proposal] = await db
    .select()
    .from(lunchProposals)
    .where(eq(lunchProposals.id, parsed.data.proposalId))
    .limit(1);
  if (!proposal) return { ok: false, message: 'Proposta non trovata.' };
  if (proposal.createdBy !== userId) {
    return { ok: false, message: 'Solo il creator può cancellare la proposta.' };
  }
  if (proposal.status === 'cancelled') {
    return { ok: true, data: undefined };
  }

  await db
    .update(lunchProposals)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(eq(lunchProposals.id, proposal.id));

  return { ok: true, data: undefined };
}
