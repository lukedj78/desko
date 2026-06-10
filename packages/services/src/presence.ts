import { randomUUID } from 'node:crypto';

import { and, desc, eq, exists, gte, inArray, lt, lte, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@desko/db';
import { follows, presenceEntries, user as userTable, weeklyPatterns } from '@desko/db/schema';
import type { ActionResult, Floor, PresenceStatus } from '@desko/domain';

/**
 * Servizi di dominio "presence" — logica PURA, senza dipendenze Next.
 *
 * Questo è l'unico posto dove vivono validazione Zod, regole di business e
 * SQL del dominio. I trasporti sono adapter sottili:
 *   - `@desko/server-actions/presence`  → web (form/RSC): risolve l'utente
 *     dalla sessione, chiama qui, fa `revalidatePath`.
 *   - `@desko/queries/presence`         → letture RSC: risolve il viewer,
 *     chiama qui.
 *   - `apps/web-shadcn/app/api/presence/*` → mobile: HTTP su actions/queries.
 *
 * Convenzioni:
 *   1. Identità SEMPRE esplicita (`userId` / `viewer` come parametro):
 *      niente sessione qui dentro → testabile senza mock (PGlite e basta).
 *   2. Le mutation ritornano `ActionResult<T>`: mai throw per errori di
 *      business/validazione; throw solo per bug imprevisti dei layer sotto.
 */

// ─── Identità ────────────────────────────────────────────────────────────────

/** Chi sta guardando: serve al filtro privacy. Null = non autenticato. */
export type Viewer = { id: string; team: string | null };

/** Risolve il team del viewer dato il suo id (1 query). */
export async function resolveViewer(userId: string): Promise<Viewer> {
  const rows = await db
    .select({ team: userTable.team })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return { id: userId, team: rows[0]?.team ?? null };
}

// ─── Tipi read-side ──────────────────────────────────────────────────────────

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

export type MyProfile = {
  name: string;
  email: string;
  team: string | null;
  department: string | null;
  defaultFloor: Floor | null;
  visibility: 'company' | 'team' | 'followers' | 'hidden';
};

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

const FLOOR_CAPACITIES: Record<Floor, number> = {
  seventh_floor: 30,
  second_floor: 40,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

function flattenZod(error: z.ZodError): { message: string; fieldErrors: Record<string, string[]> } {
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

const LAST_MINUTE_HOUR = 8; // dopo le 08:00 del giorno stesso = last-minute

function isLastMinute(targetDate: string): boolean {
  const today = new Date();
  return targetDate === todayIso() && today.getHours() >= LAST_MINUTE_HOUR;
}

// ─── Privacy presenze (US-5) ─────────────────────────────────────────────────

/**
 * Condizione SQL che applica `user.presenceVisibility` rispetto al viewer.
 * Da AND-are in ogni query che espone presenze di altri utenti.
 *
 *   - le proprie presenze sono sempre visibili a se stessi
 *   - 'company'   → visibile a tutti gli utenti
 *   - 'team'      → visibile solo a chi ha lo stesso `user.team`
 *   - 'followers' → visibile solo a chi segue l'utente (relazione `follows`)
 *   - 'hidden'    → mai visibile ad altri
 *
 * NB: presuppone che `userTable` sia joinata nella query chiamante.
 */
function visibleTo(viewer: Viewer | null): SQL {
  if (!viewer) {
    return eq(userTable.presenceVisibility, 'company');
  }

  const viewerFollowsOwner = exists(
    db
      .select({ one: sql`1` })
      .from(follows)
      .where(and(eq(follows.followedId, userTable.id), eq(follows.followerId, viewer.id))),
  );

  const conditions: SQL[] = [
    eq(userTable.id, viewer.id),
    eq(userTable.presenceVisibility, 'company'),
    and(eq(userTable.presenceVisibility, 'followers'), viewerFollowsOwner) as SQL,
  ];
  if (viewer.team) {
    conditions.push(
      and(eq(userTable.presenceVisibility, 'team'), eq(userTable.team, viewer.team)) as SQL,
    );
  }
  return or(...conditions) as SQL;
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/**
 * Tutte le presenze visibili al viewer per una data (default: oggi).
 * Ordinato: viewer prima, poi per nome.
 */
export async function getPresencesForDate(
  viewer: Viewer | null,
  date?: string,
): Promise<PresenceEntry[]> {
  const targetDate = date ?? todayIso();

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
        visibleTo(viewer),
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

  if (viewer) {
    const me = viewer.id;
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

/** Conteggio aggregato per la dashboard "Oggi". */
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

/** Occupazione corrente per piano (US-7), calcolata sulle presenze visibili al viewer. */
export async function getFloorOccupancy(viewer: Viewer | null): Promise<{
  byFloor: FloorOccupancy[];
  unassignedCount: number;
  totalInOffice: number;
}> {
  const presences = await getPresencesForDate(viewer);
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

/** Stato dichiarato per OGGI di un utente. */
export async function getPresenceToday(userId: string): Promise<{
  status: PresenceStatus;
  floor: Floor | null;
  lastFloorUpdateAt: string | null;
}> {
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

/** Pattern ricorrente settimanale di un utente. */
export async function getWeeklyPattern(userId: string): Promise<WeeklyPattern> {
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

/** Profilo per /settings: anagrafica read-only + preferenze privacy. */
export async function getProfile(userId: string): Promise<MyProfile> {
  const rows = await db
    .select({
      name: userTable.name,
      email: userTable.email,
      team: userTable.team,
      department: userTable.department,
      defaultFloor: userTable.defaultFloor,
      visibility: userTable.presenceVisibility,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error('UNAUTHORIZED');

  return {
    name: row.name,
    email: row.email,
    team: row.team ?? null,
    department: row.department ?? null,
    defaultFloor: row.defaultFloor as Floor | null,
    visibility: row.visibility as MyProfile['visibility'],
  };
}

/**
 * Vista settimanale dei colleghi seguiti dal viewer (US-3).
 * Applica il filtro privacy anche alla lista dei seguiti.
 */
export async function getFollowedColleaguesWeek(
  viewer: Viewer,
  isoWeekStart: string,
): Promise<{
  days: string[];
  rows: Array<{
    user: Pick<PresenceEntry, 'userId' | 'displayName' | 'initials'>;
    statuses: PresenceStatus[];
  }>;
}> {
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
    .where(
      and(eq(follows.followerId, viewer.id), eq(userTable.banned, false), visibleTo(viewer)),
    );

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

/** Lista degli utenti seguiti da `userId` (per /settings). */
export async function getFollows(userId: string): Promise<
  Array<{ userId: string; displayName: string; initials: string; team: string | null }>
> {
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

/** Ricerca dipendenti (autocomplete "segui collega"), escluso il richiedente. */
export async function searchUsers(
  requesterId: string,
  query: string,
  limit = 20,
): Promise<
  Array<{ userId: string; displayName: string; email: string; initials: string; team: string | null }>
> {
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
    .filter((r) => r.id !== requesterId)
    .map((r) => ({
      userId: r.id,
      displayName: r.name,
      email: r.email,
      initials: initialsFromName(r.name),
      team: r.team ?? null,
    }));
}

/**
 * Presenze in_office visibili al viewer per un intervallo, aggregate per data.
 * Usata dalla griglia mensile di /calendar.
 */
export async function getPresencesForRange(
  viewer: Viewer | null,
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
        visibleTo(viewer),
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
 * Conteggio personale per i KPI di /calendar:
 * planned = presenze future in_office, pending = last-minute, remote = remote (30 gg).
 */
export async function getMonthCounts(userId: string): Promise<{
  planned: number;
  pending: number;
  remote: number;
}> {
  const today = todayIso();
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
        eq(presenceEntries.userId, userId),
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

// ─── Validation schemas (writes) ─────────────────────────────────────────────

const dateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve essere in formato YYYY-MM-DD');

const presenceStatusSchema = z.enum(['in_office', 'remote', 'unspecified']);
const floorSchema = z.enum(['seventh_floor', 'second_floor']);

const declarePresenceSchema = z.object({
  date: dateIsoSchema,
  status: presenceStatusSchema,
  floor: floorSchema.nullable().optional(),
  note: z.string().max(280).optional(),
});

const updateFloorSchema = z.object({
  date: dateIsoSchema,
  floor: floorSchema.nullable(),
});

const weeklyPatternSchema = z.object({
  monday: presenceStatusSchema.default('unspecified'),
  tuesday: presenceStatusSchema.default('unspecified'),
  wednesday: presenceStatusSchema.default('unspecified'),
  thursday: presenceStatusSchema.default('unspecified'),
  friday: presenceStatusSchema.default('unspecified'),
  defaultFloor: floorSchema.nullable().optional(),
});

const updateVisibilitySchema = z.object({
  visibility: z.enum(['company', 'team', 'followers', 'hidden']),
});

const declareWeekSchema = z.object({
  weekStart: dateIsoSchema,
  days: z
    .array(
      z.object({
        date: dateIsoSchema,
        status: presenceStatusSchema,
        floor: floorSchema.nullable().optional(),
      }),
    )
    .min(1)
    .max(7),
});

const followSchema = z.object({ targetUserId: z.string().min(1) });

export type DeclarePresenceInput = z.infer<typeof declarePresenceSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;
export type WeeklyPatternInput = z.infer<typeof weeklyPatternSchema>;
export type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;
export type DeclareWeekInput = z.infer<typeof declareWeekSchema>;
export type FollowInput = z.infer<typeof followSchema>;

// ─── Writes ──────────────────────────────────────────────────────────────────

/**
 * Dichiara la presenza per un singolo giorno (US-1).
 * Upsert: se esiste già una presenza per (userId, date), la aggiorna.
 */
export async function declarePresence(
  userId: string,
  input: DeclarePresenceInput,
): Promise<ActionResult<{ date: string; status: PresenceStatus; floor: Floor | null }>> {
  const parsed = declarePresenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const { date, status, floor, note } = parsed.data;
    const isLM = status === 'in_office' && isLastMinute(date);

    await db
      .insert(presenceEntries)
      .values({
        id: randomUUID(),
        userId,
        date,
        status,
        floor: floor ?? null,
        note: note ?? null,
        isLastMinute: isLM,
        fromPattern: false,
        lastFloorUpdateAt: floor ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          status,
          floor: floor ?? null,
          note: note ?? null,
          isLastMinute: isLM,
          fromPattern: false,
          lastFloorUpdateAt: floor ? new Date() : null,
          updatedAt: new Date(),
        },
      });

    return { ok: true, data: { date, status, floor: floor ?? null } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore inatteso nella dichiarazione di presenza.',
    };
  }
}

/**
 * Aggiorna SOLO il piano per la presenza di una data specifica (US-7).
 * Pensata per il flow "Sposta al 2°" durante la giornata.
 */
export async function updateFloor(
  userId: string,
  input: UpdateFloorInput,
): Promise<ActionResult<{ floor: Floor | null; updatedAt: string }>> {
  const parsed = updateFloorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const now = new Date();

    // Upsert: se non c'è una row per oggi, la creiamo come 'in_office' con il piano scelto.
    await db
      .insert(presenceEntries)
      .values({
        id: randomUUID(),
        userId,
        date: parsed.data.date,
        status: 'in_office',
        floor: parsed.data.floor,
        isLastMinute: isLastMinute(parsed.data.date),
        fromPattern: false,
        lastFloorUpdateAt: now,
      })
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          floor: parsed.data.floor,
          status: 'in_office',
          lastFloorUpdateAt: now,
          updatedAt: now,
        },
      });

    return { ok: true, data: { floor: parsed.data.floor, updatedAt: now.toISOString() } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nello spostamento di piano.',
    };
  }
}

/**
 * Esce dall'ufficio per oggi: marca la presenza come 'remote'.
 * Equivalente a "annullo la mia presenza in ufficio dichiarata stamattina".
 */
export async function leaveOffice(userId: string): Promise<ActionResult<{ status: PresenceStatus }>> {
  try {
    await db
      .insert(presenceEntries)
      .values({
        id: randomUUID(),
        userId,
        date: todayIso(),
        status: 'remote',
        floor: null,
        isLastMinute: false,
        fromPattern: false,
      })
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          status: 'remote',
          floor: null,
          updatedAt: new Date(),
        },
      });

    return { ok: true, data: { status: 'remote' } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore.',
    };
  }
}

/**
 * Update batch settimanale: assegna stati per più giorni in una sola call.
 * Usato dalla `/calendar` quando l'utente conferma la settimana.
 */
export async function declareWeek(
  userId: string,
  input: DeclareWeekInput,
): Promise<ActionResult<{ count: number }>> {
  const parsed = declareWeekSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const rows = parsed.data.days.map((d) => ({
      id: randomUUID(),
      userId,
      date: d.date,
      status: d.status,
      floor: d.floor ?? null,
      isLastMinute: d.status === 'in_office' && isLastMinute(d.date),
      fromPattern: false,
      lastFloorUpdateAt: d.floor ? new Date() : null,
    }));

    for (const row of rows) {
      await db
        .insert(presenceEntries)
        .values(row)
        .onConflictDoUpdate({
          target: [presenceEntries.userId, presenceEntries.date],
          set: {
            status: row.status,
            floor: row.floor,
            isLastMinute: row.isLastMinute,
            fromPattern: false,
            lastFloorUpdateAt: row.lastFloorUpdateAt,
            updatedAt: new Date(),
          },
        });
    }

    return { ok: true, data: { count: rows.length } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore aggiornamento settimanale.',
    };
  }
}

/** Pattern ricorrente settimanale (US-1). Upsert su (userId). */
export async function updateWeeklyPattern(
  userId: string,
  input: WeeklyPatternInput,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = weeklyPatternSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    await db
      .insert(weeklyPatterns)
      .values({
        id: randomUUID(),
        userId,
        ...parsed.data,
        defaultFloor: parsed.data.defaultFloor ?? null,
      })
      .onConflictDoUpdate({
        target: weeklyPatterns.userId,
        set: {
          monday: parsed.data.monday,
          tuesday: parsed.data.tuesday,
          wednesday: parsed.data.wednesday,
          thursday: parsed.data.thursday,
          friday: parsed.data.friday,
          defaultFloor: parsed.data.defaultFloor ?? null,
          updatedAt: new Date(),
        },
      });

    return { ok: true, data: { updated: true } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nel salvataggio del pattern settimanale.',
    };
  }
}

/** Aggiorna la visibilità delle proprie presenze (US-5). */
export async function updateVisibility(
  userId: string,
  input: UpdateVisibilityInput,
): Promise<ActionResult<{ visibility: 'company' | 'team' | 'followers' | 'hidden' }>> {
  const parsed = updateVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    await db
      .update(userTable)
      .set({ presenceVisibility: parsed.data.visibility, updatedAt: new Date() })
      .where(eq(userTable.id, userId));

    return { ok: true, data: { visibility: parsed.data.visibility } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nel salvataggio della visibilità.',
    };
  }
}

/**
 * Diritto all'oblio (US-5): cancella lo storico delle presenze passate
 * dell'utente. Hard delete; oggi e futuro restano invariati.
 */
export async function archivePastPresences(
  userId: string,
): Promise<ActionResult<{ archivedCount: number }>> {
  try {
    const deleted = await db
      .delete(presenceEntries)
      .where(
        and(
          eq(presenceEntries.userId, userId),
          // Solo le date strettamente passate; lasciamo invariate quelle di oggi e future
          lt(presenceEntries.date, todayIso()),
        ),
      )
      .returning({ id: presenceEntries.id });

    return { ok: true, data: { archivedCount: deleted.length } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nella cancellazione dello storico.',
    };
  }
}

/** Segui un collega (US-3). */
export async function followUser(
  userId: string,
  input: FollowInput,
): Promise<ActionResult<{ followed: true }>> {
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    if (userId === parsed.data.targetUserId) {
      return {
        ok: false,
        message: 'Non puoi seguire te stesso.',
      };
    }

    await db
      .insert(follows)
      .values({
        id: randomUUID(),
        followerId: userId,
        followedId: parsed.data.targetUserId,
      })
      .onConflictDoNothing({ target: [follows.followerId, follows.followedId] });

    return { ok: true, data: { followed: true } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nel follow.',
    };
  }
}

/** Smetti di seguire un collega (US-3). */
export async function unfollowUser(
  userId: string,
  input: FollowInput,
): Promise<ActionResult<{ unfollowed: true }>> {
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          eq(follows.followedId, parsed.data.targetUserId),
        ),
      );

    return { ok: true, data: { unfollowed: true } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nell\'unfollow.',
    };
  }
}
