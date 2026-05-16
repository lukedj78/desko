import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { getCurrentUserId } from '@/lib/auth-server';
import { db } from '@/lib/db';
import {
  follows,
  presenceEntries,
  user as userTable,
  weeklyPatterns,
} from '@/lib/db/schema';
import type { Floor, PresenceStatus } from '@/lib/presence-domain';

/**
 * Read-side per il dominio "presence" — query Drizzle reali su Postgres.
 *
 * Convenzione:
 *   - `lib/queries/<dominio>.ts` per i READ (RSC + server actions chiamano da qui).
 *   - `lib/server/<dominio>.ts` per le MUTATIONS.
 *   - Tenant-scoping: nessuno (single-tenant). User-scoping: tramite session.
 *   - Tutte le query sono async, restituiscono dati pronti per UI.
 */

export type PresenceEntry = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
  date: string;
  status: PresenceStatus;
  floor: Floor | null;
  lastFloorUpdateAt: string | null;
  isLastMinute: boolean;
};

export type WeeklyPattern = {
  monday: PresenceStatus;
  tuesday: PresenceStatus;
  wednesday: PresenceStatus;
  thursday: PresenceStatus;
  friday: PresenceStatus;
  defaultFloor: Floor | null;
};

export type FloorOccupancy = {
  floor: Floor;
  presentCount: number;
  capacity: number;
  byTeam: Array<{ team: string; count: number }>;
  recentlyMovedIn: PresenceEntry[];
};

const FLOOR_CAPACITIES: Record<Floor, number> = {
  seventh_floor: 30,
  second_floor: 40,
};

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

/**
 * Tutte le presenze dichiarate per una data specifica (default: oggi).
 * Join con la tabella `user` per recuperare displayName + team.
 * Ordinato: utente loggato prima, poi per team match, poi per nome.
 */
export async function getPresencesForDate(date?: string): Promise<PresenceEntry[]> {
  const targetDate = date ?? todayIso();

  let myUserId: string | null = null;
  try {
    myUserId = await getCurrentUserId();
  } catch {
    // Non loggato: continuiamo senza ordering personalizzato
  }

  const rows = await db
    .select({
      userId: presenceEntries.userId,
      displayName: userTable.name,
      team: userTable.team,
      date: presenceEntries.date,
      status: presenceEntries.status,
      floor: presenceEntries.floor,
      lastFloorUpdateAt: presenceEntries.lastFloorUpdateAt,
      isLastMinute: presenceEntries.isLastMinute,
    })
    .from(presenceEntries)
    .innerJoin(userTable, eq(presenceEntries.userId, userTable.id))
    .where(
      and(
        eq(presenceEntries.date, targetDate),
        eq(userTable.banned, false),
      ),
    );

  const entries: PresenceEntry[] = rows.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
    initials: initialsFromName(r.displayName),
    team: r.team ?? null,
    date: r.date,
    status: r.status as PresenceStatus,
    floor: r.floor as Floor | null,
    lastFloorUpdateAt: r.lastFloorUpdateAt ? r.lastFloorUpdateAt.toISOString() : null,
    isLastMinute: r.isLastMinute,
  }));

  // Sort: me first, then by name
  if (myUserId) {
    const me = myUserId;
    entries.sort((a, b) => {
      if (a.userId === me) return -1;
      if (b.userId === me) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  } else {
    entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return entries;
}

/**
 * Conteggio aggregato per la dashboard "Oggi".
 */
export async function getTodayCounts(): Promise<{
  inOfficeCertain: number;
  inOfficeFromPattern: number;
  lastMinute: number;
  totalDeclared: number;
  remote: number;
}> {
  const today = todayIso();

  const rows = await db
    .select({
      status: presenceEntries.status,
      isLastMinute: presenceEntries.isLastMinute,
      fromPattern: presenceEntries.fromPattern,
    })
    .from(presenceEntries)
    .where(eq(presenceEntries.date, today));

  let inOfficeCertain = 0;
  let inOfficeFromPattern = 0;
  let lastMinute = 0;
  let remote = 0;

  for (const r of rows) {
    if (r.status === 'in_office') {
      if (r.fromPattern) inOfficeFromPattern += 1;
      else inOfficeCertain += 1;
      if (r.isLastMinute) lastMinute += 1;
    } else if (r.status === 'remote') {
      remote += 1;
    }
  }

  return {
    inOfficeCertain,
    inOfficeFromPattern,
    lastMinute,
    totalDeclared: inOfficeCertain + inOfficeFromPattern,
    remote,
  };
}

/**
 * Occupazione corrente per piano (US-7). Calcolata da `getPresencesForDate(today)`.
 */
export async function getFloorOccupancy(): Promise<{
  byFloor: FloorOccupancy[];
  unassignedCount: number;
  totalInOffice: number;
}> {
  const presences = await getPresencesForDate();
  const inOffice = presences.filter((p) => p.status === 'in_office');

  const groupByTeam = (entries: PresenceEntry[]) => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const t = e.team ?? 'Altri';
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count);
  };

  const buildOccupancy = (floor: Floor): FloorOccupancy => {
    const entries = inOffice.filter((p) => p.floor === floor);
    return {
      floor,
      presentCount: entries.length,
      capacity: FLOOR_CAPACITIES[floor],
      byTeam: groupByTeam(entries),
      recentlyMovedIn: entries.slice(0, 5),
    };
  };

  const unassigned = inOffice.filter((p) => p.floor === null);

  return {
    byFloor: [buildOccupancy('seventh_floor'), buildOccupancy('second_floor')],
    unassignedCount: unassigned.length,
    totalInOffice: inOffice.length,
  };
}

/**
 * Stato dichiarato per OGGI dell'utente corrente.
 * Usato dalla check-in card della dashboard.
 */
export async function getMyPresenceToday(): Promise<{
  status: PresenceStatus;
  floor: Floor | null;
  lastFloorUpdateAt: string | null;
}> {
  const userId = await getCurrentUserId();
  const today = todayIso();

  const rows = await db
    .select()
    .from(presenceEntries)
    .where(and(eq(presenceEntries.userId, userId), eq(presenceEntries.date, today)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { status: 'unspecified', floor: null, lastFloorUpdateAt: null };
  }

  return {
    status: row.status as PresenceStatus,
    floor: row.floor as Floor | null,
    lastFloorUpdateAt: row.lastFloorUpdateAt ? row.lastFloorUpdateAt.toISOString() : null,
  };
}

/**
 * Pattern ricorrente settimanale dell'utente corrente.
 */
export async function getMyWeeklyPattern(): Promise<WeeklyPattern> {
  const userId = await getCurrentUserId();

  const rows = await db
    .select()
    .from(weeklyPatterns)
    .where(eq(weeklyPatterns.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return {
      monday: 'unspecified',
      tuesday: 'unspecified',
      wednesday: 'unspecified',
      thursday: 'unspecified',
      friday: 'unspecified',
      defaultFloor: null,
    };
  }

  return {
    monday: row.monday as PresenceStatus,
    tuesday: row.tuesday as PresenceStatus,
    wednesday: row.wednesday as PresenceStatus,
    thursday: row.thursday as PresenceStatus,
    friday: row.friday as PresenceStatus,
    defaultFloor: row.defaultFloor as Floor | null,
  };
}

/**
 * Vista settimanale per la lista dei colleghi seguiti (US-3).
 * Ritorna 5 giorni × N persone seguite + le loro presenze.
 */
export async function getFollowedColleaguesWeek(isoWeekStart: string): Promise<{
  days: string[];
  rows: Array<{
    user: Pick<PresenceEntry, 'userId' | 'displayName' | 'initials'>;
    statuses: PresenceStatus[];
  }>;
}> {
  const userId = await getCurrentUserId();

  const days: string[] = [];
  const start = new Date(isoWeekStart);
  for (let i = 0; i < 5; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const followedUsers = await db
    .select({ id: userTable.id, name: userTable.name })
    .from(follows)
    .innerJoin(userTable, eq(follows.followedId, userTable.id))
    .where(and(eq(follows.followerId, userId), eq(userTable.banned, false)));

  if (followedUsers.length === 0) {
    return { days, rows: [] };
  }

  const followedIds = followedUsers.map((u) => u.id);
  const lastDay = days[days.length - 1];
  const firstDay = days[0];
  if (!firstDay || !lastDay) return { days, rows: [] };

  const presences = await db
    .select()
    .from(presenceEntries)
    .where(
      and(
        inArray(presenceEntries.userId, followedIds),
        gte(presenceEntries.date, firstDay),
        lte(presenceEntries.date, lastDay),
      ),
    );

  const rows = followedUsers.map((u) => {
    const statuses: PresenceStatus[] = days.map((day) => {
      const entry = presences.find((p) => p.userId === u.id && p.date === day);
      return (entry?.status as PresenceStatus | undefined) ?? 'unspecified';
    });
    return {
      user: {
        userId: u.id,
        displayName: u.name,
        initials: initialsFromName(u.name),
      },
      statuses,
    };
  });

  return { days, rows };
}

/**
 * Eventi aziendali correlati all'ufficio nei prossimi giorni.
 * Per ora hardcoded — quando ci sarà una tabella `office_events` la sostituiremo con Drizzle query.
 */
export async function getUpcomingOfficeEvents(): Promise<
  Array<{
    date: string;
    title: string;
    location: string;
    kind: 'closure' | 'event' | 'team_building';
  }>
> {
  // TODO: introdurre tabella `office_events` quando l'admin avrà la UI per gestirli.
  return [
    { date: '2026-05-16', title: 'Chiusura Straordinaria', location: 'Sede di Milano', kind: 'closure' },
    { date: '2026-05-19', title: 'Team Building', location: 'Parco Sempione', kind: 'team_building' },
    { date: '2026-05-22', title: 'All-hands trimestrale', location: '7° Piano · Sala grande', kind: 'event' },
  ];
}

/**
 * Lista degli utenti che l'utente corrente segue (per /impostazioni).
 */
export async function getMyFollows(): Promise<
  Array<{ userId: string; displayName: string; initials: string; team: string | null }>
> {
  const userId = await getCurrentUserId();
  const rows = await db
    .select({ id: userTable.id, name: userTable.name, team: userTable.team })
    .from(follows)
    .innerJoin(userTable, eq(follows.followedId, userTable.id))
    .where(and(eq(follows.followerId, userId), eq(userTable.banned, false)))
    .orderBy(userTable.name);

  return rows.map((r) => ({
    userId: r.id,
    displayName: r.name,
    initials: initialsFromName(r.name),
    team: r.team ?? null,
  }));
}

/**
 * Dipendenti dell'azienda (per autocomplete "segui collega" in /impostazioni).
 */
export async function searchUsers(query: string, limit = 20): Promise<
  Array<{ userId: string; displayName: string; email: string; initials: string; team: string | null }>
> {
  const myUserId = await getCurrentUserId();
  const q = `%${query.toLowerCase()}%`;

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      team: userTable.team,
    })
    .from(userTable)
    .where(
      and(
        eq(userTable.banned, false),
        sql`(LOWER(${userTable.name}) LIKE ${q} OR LOWER(${userTable.email}) LIKE ${q})`,
      ),
    )
    .limit(limit)
    .orderBy(desc(userTable.createdAt));

  return rows
    .filter((r) => r.id !== myUserId)
    .map((r) => ({
      userId: r.id,
      displayName: r.name,
      email: r.email,
      initials: initialsFromName(r.name),
      team: r.team ?? null,
    }));
}

// ─── Calendar mensile ────────────────────────────────────────────────────────

export type MonthAttendee = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
  floor: Floor | null;
};

export type MonthDayPresence = {
  date: string; // YYYY-MM-DD
  attendees: MonthAttendee[];
};

/**
 * Presenze in_office per un intervallo di date, aggregate per data.
 * Usata dalla pagina /calendar per popolare la griglia mensile.
 *
 * @param fromDate YYYY-MM-DD inclusivo
 * @param toDate   YYYY-MM-DD inclusivo
 */
export async function getPresencesForRange(
  fromDate: string,
  toDate: string,
): Promise<MonthDayPresence[]> {
  const rows = await db
    .select({
      userId: presenceEntries.userId,
      displayName: userTable.name,
      team: userTable.team,
      date: presenceEntries.date,
      floor: presenceEntries.floor,
    })
    .from(presenceEntries)
    .innerJoin(userTable, eq(presenceEntries.userId, userTable.id))
    .where(
      and(
        gte(presenceEntries.date, fromDate),
        lte(presenceEntries.date, toDate),
        eq(presenceEntries.status, 'in_office'),
        eq(userTable.banned, false),
      ),
    );

  const byDate = new Map<string, MonthAttendee[]>();
  for (const r of rows) {
    const list = byDate.get(r.date) ?? [];
    list.push({
      userId: r.userId,
      displayName: r.displayName,
      initials: initialsFromName(r.displayName),
      team: r.team ?? null,
      floor: r.floor as Floor | null,
    });
    byDate.set(r.date, list);
  }
  // Stabile per ordine alfabetico interno (così la griglia mostra gli stessi
  // nomi senza shuffle ad ogni render).
  for (const [k, list] of byDate) {
    list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    byDate.set(k, list);
  }
  return Array.from(byDate.entries()).map(([date, attendees]) => ({ date, attendees }));
}

/**
 * Conteggio personale per la dashboard /calendar (3 KPI in alto):
 * pianificati = mie presenze future (oggi+) con status in_office,
 * inSospeso   = mie presenze last-minute (entro N giorni) — proxy: today only,
 * remote      = mie presenze remote nei prossimi 30 gg.
 */
export async function getMyMonthCounts(): Promise<{
  planned: number;
  pending: number;
  remote: number;
}> {
  const myUserId = await getCurrentUserId();
  const today = todayIso();
  // 30 giorni avanti
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);
  const horizonIso = `${horizon.getFullYear()}-${String(horizon.getMonth() + 1).padStart(2, '0')}-${String(horizon.getDate()).padStart(2, '0')}`;

  const rows = await db
    .select({
      status: presenceEntries.status,
      isLastMinute: presenceEntries.isLastMinute,
      date: presenceEntries.date,
    })
    .from(presenceEntries)
    .where(
      and(
        eq(presenceEntries.userId, myUserId),
        gte(presenceEntries.date, today),
        lte(presenceEntries.date, horizonIso),
      ),
    );

  let planned = 0;
  let pending = 0;
  let remote = 0;
  for (const r of rows) {
    if (r.status === 'in_office') {
      planned += 1;
      if (r.isLastMinute) pending += 1;
    } else if (r.status === 'remote') {
      remote += 1;
    }
  }
  return { planned, pending, remote };
}
