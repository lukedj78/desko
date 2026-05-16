import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { presenceEntries, user as userTable } from '@/lib/db/schema';

/**
 * Read-side aggregato per /admin/analytics (US-6).
 *
 * Tutte le query restituiscono SOLO conteggi/medie — mai nomi, mai liste utente.
 * Soglia anti-deanon: gli aggregati con < `MIN_BUCKET_SIZE` persone vengono
 * censurati (returned as null / 0 con un flag `suppressed`).
 *
 * Granularità:
 *  - "today": stato oggi (totale + per piano).
 *  - "weekday": medie per giorno della settimana negli ultimi 28 giorni.
 *  - "weekly": serie temporale per settimana ISO ultime 8 settimane.
 */

const MIN_BUCKET_SIZE = 3;

export type HrTodaySummary = {
  date: string;
  totalActiveUsers: number;
  inOfficeTotal: number;
  inOfficeBySeventh: number;
  inOfficeBySecond: number;
  remoteTotal: number;
  unspecifiedTotal: number;
  inOfficePct: number; // 0..100, % di active users in office oggi
};

export type WeekdayStat = {
  weekday: 1 | 2 | 3 | 4 | 5; // 1 = Monday, 5 = Friday
  weekdayLabel: string;
  inOfficeAvg: number; // media giornaliera persone in office (ultime 4 sett)
  inOfficePct: number; // % rispetto al totale active users
  suppressed: boolean; // true se sotto soglia anti-deanon
};

export type WeeklyTrendPoint = {
  isoWeek: string; // YYYY-Www
  weekStart: string; // YYYY-MM-DD del lunedì
  inOfficeTotal: number; // somma di presence in_office nella settimana
  uniqueUsers: number; // distinct user che hanno dichiarato in-office
};

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Gio',
  5: 'Ven',
};

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysAgoISO = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Snapshot di "oggi": quanti dipendenti sono in office, su che piano, quanti remote.
 */
export async function getHrTodaySummary(): Promise<HrTodaySummary> {
  const date = todayISO();

  const activeUsersRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userTable)
    .where(eq(userTable.banned, false));
  const totalActiveUsers = activeUsersRows[0]?.count ?? 0;

  const rows = await db
    .select({
      status: presenceEntries.status,
      floor: presenceEntries.floor,
      count: sql<number>`count(*)::int`,
    })
    .from(presenceEntries)
    .where(eq(presenceEntries.date, date))
    .groupBy(presenceEntries.status, presenceEntries.floor);

  let inOfficeTotal = 0;
  let inOfficeBySeventh = 0;
  let inOfficeBySecond = 0;
  let remoteTotal = 0;
  let unspecifiedTotal = 0;

  for (const r of rows) {
    if (r.status === 'in_office') {
      inOfficeTotal += r.count;
      if (r.floor === 'seventh_floor') inOfficeBySeventh += r.count;
      else if (r.floor === 'second_floor') inOfficeBySecond += r.count;
    } else if (r.status === 'remote') {
      remoteTotal += r.count;
    } else {
      unspecifiedTotal += r.count;
    }
  }

  const inOfficePct =
    totalActiveUsers > 0
      ? Math.round((inOfficeTotal / totalActiveUsers) * 100)
      : 0;

  return {
    date,
    totalActiveUsers,
    inOfficeTotal,
    inOfficeBySeventh,
    inOfficeBySecond,
    remoteTotal,
    unspecifiedTotal,
    inOfficePct,
  };
}

/**
 * Medie per giorno della settimana, ultimi 28 giorni.
 * Postgres EXTRACT(DOW): 0=Dom..6=Sab. Filtriamo solo Lun-Ven (1..5).
 */
export async function getWeekdayStats(totalActiveUsers: number): Promise<WeekdayStat[]> {
  const startDate = daysAgoISO(28);

  const rows = await db
    .select({
      dow: sql<number>`EXTRACT(DOW FROM ${presenceEntries.date}::date)::int`,
      inOfficeCount: sql<number>`count(*) FILTER (WHERE ${presenceEntries.status} = 'in_office')::int`,
      totalDays: sql<number>`count(DISTINCT ${presenceEntries.date})::int`,
    })
    .from(presenceEntries)
    .where(
      and(
        gte(presenceEntries.date, startDate),
        // Solo giorni feriali (Mon-Fri):
        sql`EXTRACT(DOW FROM ${presenceEntries.date}::date) BETWEEN 1 AND 5`,
      ),
    )
    .groupBy(sql`EXTRACT(DOW FROM ${presenceEntries.date}::date)`);

  const byDow = new Map<number, { inOfficeCount: number; totalDays: number }>();
  for (const r of rows) {
    byDow.set(r.dow, { inOfficeCount: r.inOfficeCount, totalDays: r.totalDays });
  }

  const result: WeekdayStat[] = [];
  for (let dow = 1; dow <= 5; dow++) {
    const entry = byDow.get(dow);
    const inOfficeCount = entry?.inOfficeCount ?? 0;
    const totalDays = entry?.totalDays ?? 0;
    const inOfficeAvg =
      totalDays > 0 ? Math.round((inOfficeCount / totalDays) * 10) / 10 : 0;
    const inOfficePct =
      totalActiveUsers > 0
        ? Math.round((inOfficeAvg / totalActiveUsers) * 100)
        : 0;
    const suppressed = inOfficeAvg > 0 && inOfficeAvg < MIN_BUCKET_SIZE;

    result.push({
      weekday: dow as 1 | 2 | 3 | 4 | 5,
      weekdayLabel: WEEKDAY_LABELS[dow]!,
      inOfficeAvg: suppressed ? 0 : inOfficeAvg,
      inOfficePct: suppressed ? 0 : inOfficePct,
      suppressed,
    });
  }

  return result;
}

/**
 * Trend settimanale, ultime 8 settimane (ISO week).
 * inOfficeTotal = somma giornaliera presence in_office nella settimana.
 * uniqueUsers = distinct user-id che hanno dichiarato almeno una presenza in_office.
 */
export async function getWeeklyTrend(): Promise<WeeklyTrendPoint[]> {
  const startDate = daysAgoISO(56); // 8 settimane

  const rows = await db
    .select({
      isoWeek: sql<string>`to_char(${presenceEntries.date}::date, 'IYYY-"W"IW')`,
      weekStart: sql<string>`to_char(date_trunc('week', ${presenceEntries.date}::date), 'YYYY-MM-DD')`,
      inOfficeTotal: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(DISTINCT ${presenceEntries.userId})::int`,
    })
    .from(presenceEntries)
    .where(
      and(
        gte(presenceEntries.date, startDate),
        eq(presenceEntries.status, 'in_office'),
      ),
    )
    .groupBy(sql`1, 2`)
    .orderBy(sql`2 ASC`);

  return rows.map((r) => ({
    isoWeek: r.isoWeek,
    weekStart: r.weekStart,
    inOfficeTotal: r.inOfficeTotal,
    uniqueUsers: r.uniqueUsers,
  }));
}

/**
 * Aggregato singolo per il page render — esegue le 3 query in parallelo.
 */
export async function getHrAnalyticsSummary() {
  const today = await getHrTodaySummary();
  const [weekday, weekly] = await Promise.all([
    getWeekdayStats(today.totalActiveUsers),
    getWeeklyTrend(),
  ]);
  return { today, weekday, weekly };
}
