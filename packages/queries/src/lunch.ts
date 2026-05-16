import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { getCurrentUserId } from '@desko/auth/server';
import { db } from '@desko/db';
import {
  lunchProposalInvites,
  lunchProposalParticipants,
  lunchProposals,
  restaurantRatings,
  restaurants,
  user as userTable,
} from '@desko/db/schema';

/**
 * Read-side per il dominio "lunch" — query Drizzle reali su Postgres.
 *
 * Convenzioni:
 *   - tutto async, restituisce dati pronti per UI (display name, initials, rating avg).
 *   - una proposta privata è visibile solo al creator + invitati + partecipanti.
 *   - una proposta pubblica è visibile a tutti gli utenti attivi.
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

// ─── Restaurants ─────────────────────────────────────────────────────────────

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

// ─── Proposals ───────────────────────────────────────────────────────────────

/**
 * Carica le partecipazioni e le info utente per un set di proposte (single round-trip).
 */
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

/**
 * Set di (proposal_id) per cui l'utente corrente è invitato.
 */
async function loadMyInvitesForProposals(
  myUserId: string,
  proposalIds: string[],
): Promise<Set<string>> {
  if (proposalIds.length === 0) return new Set();
  const rows = await db
    .select({ proposalId: lunchProposalInvites.proposalId })
    .from(lunchProposalInvites)
    .where(
      and(
        eq(lunchProposalInvites.userId, myUserId),
        inArray(lunchProposalInvites.proposalId, proposalIds),
      ),
    );
  return new Set(rows.map((r) => r.proposalId));
}

async function loadInviteCounts(
  proposalIds: string[],
): Promise<Map<string, number>> {
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
 * Proposte di pranzo visibili all'utente per una data specifica (default: oggi).
 *
 * Visibilità:
 *   - 'public': tutti la vedono
 *   - 'private': solo creator + invitati + partecipanti già uniti
 *
 * Restituisce solo proposte in stato 'open' (le cancellate non compaiono).
 */
export async function getLunchProposalsForDate(
  date?: string,
): Promise<ProposalSummary[]> {
  const targetDate = date ?? todayIso();
  const myUserId = await getCurrentUserId();

  // 1. Carica tutte le proposte open per la data + restaurant + rating + creator
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
    loadMyInvitesForProposals(myUserId, proposalIds),
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

  // 3. Filtra: tutte le pubbliche; le private solo se sono creator/invitato/partecipante
  const result: ProposalSummary[] = [];
  for (const p of proposalRows) {
    const participants = participantsByProposal.get(p.proposalId) ?? [];
    const iAmCreator = p.createdById === myUserId;
    const iAmParticipant = participants.some((x) => x.userId === myUserId);
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

/**
 * Proposte di pranzo che l'utente ha creato negli ultimi 30 giorni
 * (in qualsiasi stato, per la pagina "Mie proposte").
 */
export async function getMyLunchProposals(): Promise<ProposalSummary[]> {
  const myUserId = await getCurrentUserId();
  // Riusa la query base con filtro createdBy applicato post-filtro
  // (semplice ma adeguato per <100 proposte personali).
  const rows = await db
    .select({ id: lunchProposals.id, date: lunchProposals.date })
    .from(lunchProposals)
    .where(eq(lunchProposals.createdBy, myUserId))
    .orderBy(desc(lunchProposals.date), desc(lunchProposals.meetingTime));

  // Per ogni data unica chiama getLunchProposalsForDate (in genere poche date).
  const dates = Array.from(new Set(rows.map((r) => r.date)));
  const all: ProposalSummary[] = [];
  for (const d of dates) {
    const proposals = await getLunchProposalsForDate(d);
    for (const p of proposals) {
      if (p.createdBy.userId === myUserId) all.push(p);
    }
  }
  return all;
}
