import {
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Filter,
  HomeIcon,
  Hourglass,
  Plus,
  Users,
  ViewIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { eq } from 'drizzle-orm';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmployeeHoverCard } from '@/components/site/employee-hover-card';
import { getCurrentUser } from '@desko/auth/server';
import { db, schema } from '@desko/db';
import type { Floor } from '@desko/domain';
import {
  getMyMonthCounts,
  getPresencesForDate,
  getPresencesForRange,
  getUpcomingOfficeEvents,
  type MonthAttendee,
  type MonthDayPresence,
  type PresenceEntry,
} from '@desko/queries/presence';
import { cn } from '@/lib/utils';

import { MyPresenceItem } from './_components/my-presence-item';

export const metadata = { title: 'Calendar' };
export const dynamic = 'force-dynamic';

// ─── Tipi + costanti ─────────────────────────────────────────────────────────

type EventKind = 'closure' | 'team_building' | 'event';

type DayCellMeta = {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  kind?: EventKind;
  eventLabel?: string;
  attendees: MonthAttendee[];
};

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const FLOOR_LABEL: Record<Floor, string> = {
  seventh_floor: '7° Piano · stanza',
  second_floor: '2° Piano · co-working',
};

const EVENT_STYLES: Record<EventKind, { bg: string; color: string; dot: string }> = {
  closure: { bg: 'rgba(199, 62, 68, 0.12)', color: '#8B2229', dot: '#C73E44' },
  team_building: { bg: 'rgba(45, 122, 63, 0.15)', color: '#1F5630', dot: '#2D7A3F' },
  event: { bg: 'rgba(232, 185, 49, 0.18)', color: '#5A4500', dot: '#E8B931' },
};

const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function parseMonthParam(value: string | undefined, today: Date): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map((s) => parseInt(s, 10));
    if (y && m && m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: today.getFullYear(), month: today.getMonth() };
}
function parseDateParam(value: string | undefined, today: Date): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return isoDate(today);
}
const monthQuery = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}`;

function attendeeToEntry(a: MonthAttendee, date: string, isMe: boolean): PresenceEntry {
  return {
    userId: a.userId,
    displayName: isMe ? `${a.displayName} (tu)` : a.displayName,
    initials: a.initials,
    team: a.team,
    date,
    status: 'in_office',
    floor: a.floor,
    lastFloorUpdateAt: null,
    isLastMinute: false,
  };
}

function buildMonthGrid(
  year: number,
  month: number,
  todayIsoStr: string,
  presencesByDate: Map<string, MonthAttendee[]>,
  events: Array<{ date: string; kind: string; title: string }>,
): { grid: DayCellMeta[]; monthLabel: string } {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstWeekday);

  const eventByDate = new Map<string, { kind: EventKind; label: string }>();
  for (const e of events) {
    const kind: EventKind =
      e.kind === 'closure' ? 'closure' : e.kind === 'team_building' ? 'team_building' : 'event';
    eventByDate.set(e.date, { kind, label: e.title });
  }

  const grid: DayCellMeta[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = isoDate(d);
    const event = eventByDate.get(iso);
    grid.push({
      date: iso,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isToday: iso === todayIsoStr,
      kind: event?.kind,
      eventLabel: event?.label,
      attendees: presencesByDate.get(iso) ?? [],
    });
  }
  return { grid, monthLabel: `${MONTH_NAMES[month]} ${year}` };
}

// ─── UI Sub-components ───────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, tone,
}: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <Card className="p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div
          className="inline-flex size-8 sm:size-11 items-center justify-center rounded-lg text-white shrink-0"
          style={{ backgroundColor: tone }}
        >
          {icon}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground leading-tight">
            {label}
          </span>
          <span className="font-sans text-2xl sm:text-3xl font-extrabold leading-none tracking-[-0.02em]">
            {value}
          </span>
        </div>
      </div>
    </Card>
  );
}

function CalendarMonthGrid({
  monthLabel, grid, myUserId, prevHref, nextHref, todayHref,
}: {
  monthLabel: string;
  grid: DayCellMeta[];
  myUserId: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg md:text-xl font-bold capitalize">{monthLabel}</h3>
          <Link href={todayHref} className="no-underline">
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">Oggi</Button>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link href={prevHref} className="no-underline">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Mese precedente">
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <Link href={nextHref} className="no-underline">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Mese successivo">
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {DAY_LABELS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              'py-2 text-center font-mono text-[11px] font-semibold tracking-[0.08em]',
              idx >= 5 ? 'text-muted-foreground/60' : 'text-muted-foreground',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid 6×7, righe alte uguali */}
      <div
        className="grid grid-cols-7"
        style={{ gridAutoRows: '88px' }}
      >
        {grid.map((cell, idx) => {
          const isWeekend = idx % 7 >= 5;
          const eventStyle = cell.kind ? EVENT_STYLES[cell.kind] : null;
          const attendees = cell.attendees;
          const dayHref = `/calendar?view=day&date=${cell.date}`;

          return (
            <Link
              key={cell.date}
              href={dayHref}
              className={cn(
                'block h-full overflow-hidden border-b border-r border-border p-2 md:p-3 transition-colors no-underline text-inherit',
                'cursor-pointer',
                (idx + 1) % 7 === 0 && 'border-r-0',
                cell.isToday
                  ? 'bg-primary/8 hover:bg-primary/16'
                  : !cell.inMonth || isWeekend
                  ? 'bg-muted/40 hover:bg-muted/60'
                  : 'bg-card hover:bg-muted/40',
                !cell.inMonth && 'opacity-40',
              )}
              style={{ minHeight: 'unset' }}
            >
              <div className="flex h-full flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        'font-sans font-medium text-xs tabular-nums',
                        cell.isToday
                          ? 'font-bold text-primary-foreground'
                          : cell.inMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/50',
                      )}
                    >
                      {cell.day}
                    </span>
                    {/* Pallino evento — colore matchato con "Prossimi eventi"
                        della sidebar. Hover desktop: title nativo mostra il nome.
                        (port 1:1 da MUI: solo dot, niente badge label nel cell) */}
                    {eventStyle && cell.eventLabel ? (
                      <span
                        title={cell.eventLabel}
                        className="inline-flex size-2 md:size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: eventStyle.dot }}
                      />
                    ) : null}
                  </div>
                  {cell.isToday ? (
                    <span className="size-1.5 rounded-full bg-primary" />
                  ) : null}
                </div>

                {/* Avatar group */}
                {attendees.length > 0 ? (
                  <div className="mt-auto flex items-center justify-end gap-1">
                    <div className="flex flex-row-reverse items-center">
                      {attendees.slice(0, 2).reverse().map((a, i) => {
                        const isMe = a.userId === myUserId;
                        return (
                          <EmployeeHoverCard
                            key={`${a.userId}-${i}`}
                            entry={attendeeToEntry(a, cell.date, isMe)}
                            isMe={isMe}
                          >
                            <Avatar
                              className={cn(
                                'size-6 md:size-7 ring-2 ring-primary',
                                i > 0 && '-mr-2',
                                isMe ? 'cursor-default' : 'cursor-pointer',
                              )}
                            >
                              <AvatarFallback
                                className={cn(
                                  'text-[9px] md:text-[10px] font-bold',
                                  isMe
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground',
                                )}
                              >
                                {a.initials}
                              </AvatarFallback>
                            </Avatar>
                          </EmployeeHoverCard>
                        );
                      })}
                    </div>
                    {attendees.length > 2 ? (
                      <span className="font-mono text-[10px] md:text-xs font-bold text-muted-foreground">
                        +{attendees.length - 2}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function TeamOverlapCard({
  bestDay, myUserId,
}: {
  bestDay: {
    date: string;
    label: string;
    overlapPct: number;
    attendees: MonthAttendee[];
    totalActive: number;
  };
  myUserId: string;
}) {
  const visible = bestDay.attendees.slice(0, 4);
  const overflow = Math.max(0, bestDay.attendees.length - 4);

  return (
    <Card className="p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <Users className="size-5 text-muted-foreground" />
          <Eyebrow>Team Overlap</Eyebrow>
          <h4 className="text-lg font-bold capitalize">{bestDay.label}</h4>
        </div>

        <div className="relative size-[140px]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(hsl(var(--primary)) 0% ${bestDay.overlapPct}%, hsl(var(--border)) ${bestDay.overlapPct}% 100%)`,
            }}
          />
          <div className="absolute inset-3 rounded-full bg-card flex items-center justify-center">
            <span className="font-sans text-3xl font-extrabold tracking-[-0.02em]">
              {bestDay.overlapPct}%
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {bestDay.attendees.length === 0
            ? 'Nessuna presenza dichiarata per questo giorno.'
            : `${bestDay.attendees.length} colleghi su ${bestDay.totalActive} saranno in ufficio.`}
        </p>

        {bestDay.attendees.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-row-reverse items-center">
              {[...visible].reverse().map((a, i) => {
                const isMe = a.userId === myUserId;
                return (
                  <EmployeeHoverCard
                    key={a.userId}
                    entry={attendeeToEntry(a, bestDay.date, isMe)}
                    isMe={isMe}
                  >
                    <Avatar
                      className={cn(
                        'size-7 ring-2 ring-primary',
                        i > 0 && '-mr-2.5',
                        isMe ? 'cursor-default' : 'cursor-pointer',
                      )}
                    >
                      <AvatarFallback
                        className={cn(
                          'text-[10px] font-bold',
                          isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground',
                        )}
                      >
                        {a.initials}
                      </AvatarFallback>
                    </Avatar>
                  </EmployeeHoverCard>
                );
              })}
            </div>
            {overflow > 0 ? (
              <span className="text-xs text-muted-foreground">+{overflow} altri</span>
            ) : null}
          </div>
        ) : null}

        <Link
          href={`/calendar?view=day&date=${bestDay.date}`}
          className="no-underline w-full"
        >
          <Button variant="outline" size="sm" className="w-full">
            Vedi dettagli team
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function UpcomingEventsCard({
  events,
}: {
  events: Awaited<ReturnType<typeof getUpcomingOfficeEvents>>;
}) {
  const dateFmt = (iso: string) => {
    const d = new Date(iso);
    return {
      month: d.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase().replace('.', ''),
      day: d.getDate(),
    };
  };
  const kindMeta: Record<string, { dot: string; icon: ReactNode }> = {
    closure: { dot: EVENT_STYLES.closure.dot, icon: <CalendarX2 className="size-4" /> },
    team_building: { dot: EVENT_STYLES.team_building.dot, icon: <Users className="size-4" /> },
    event: { dot: EVENT_STYLES.event.dot, icon: <CalendarX2 className="size-4" /> },
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3">
        <Eyebrow>Prossimi eventi</Eyebrow>
        <div className="flex flex-col">
          {events.map((e, idx) => {
            const fmt = dateFmt(e.date);
            const meta = kindMeta[e.kind] ?? kindMeta.event!;
            return (
              <Link
                key={e.date + e.title}
                href={`/calendar?view=day&date=${e.date}`}
                className="no-underline text-inherit"
              >
                <div
                  className={cn(
                    'flex items-center gap-3 py-2 px-1 hover:bg-muted/50 rounded-md transition-colors',
                    idx > 0 && 'border-t border-border mt-1 pt-3',
                  )}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.dot }}
                  />
                  <div className="flex flex-col items-center min-w-[44px] rounded-md border border-border bg-muted/50 px-1 py-1">
                    <span className="font-mono text-[9px] font-bold text-muted-foreground">
                      {fmt.month}
                    </span>
                    <span className="font-sans text-base font-bold leading-none">
                      {fmt.day}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.location}</p>
                  </div>
                  <span style={{ color: meta.dot }}>{meta.icon}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ─── Vista giorno ────────────────────────────────────────────────────────────

function DayPresenceList({
  title, entries, myUserId, date, emptyText,
}: {
  title: string;
  entries: PresenceEntry[];
  myUserId: string;
  date: string;
  emptyText: string;
}) {
  const header = (
    <div className="mb-3 flex items-center gap-3">
      <Eyebrow>{title}</Eyebrow>
      <span
        className={cn(
          'inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full px-2 text-[11px] font-mono font-bold',
          entries.length === 0
            ? 'bg-muted text-muted-foreground border border-border'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {entries.length}
      </span>
    </div>
  );

  if (entries.length === 0) {
    return (
      <div>
        {header}
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="flex flex-wrap gap-3">
        {entries.map((p) => {
          const isMe = p.userId === myUserId;
          if (isMe) {
            return <MyPresenceItem key={p.userId} entry={p} date={date} />;
          }
          return (
            <EmployeeHoverCard key={p.userId} entry={p} isMe={false}>
              <div
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-muted/50 hover:border-muted-foreground/40 transition-colors cursor-pointer"
                style={{ width: 260 }}
              >
                <Avatar className="size-9 ring-2 ring-primary shrink-0">
                  <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-sm font-semibold">{p.displayName}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {p.team ?? '—'}
                  </span>
                </div>
              </div>
            </EmployeeHoverCard>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  date, entries, myUserId, prevHref, nextHref, todayHref,
}: {
  date: string;
  entries: PresenceEntry[];
  myUserId: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const dateObj = new Date(date);
  const dateLabel = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const inOffice = entries.filter((e) => e.status === 'in_office');
  const seventh = inOffice.filter((e) => e.floor === 'seventh_floor');
  const second = inOffice.filter((e) => e.floor === 'second_floor');
  const noFloor = inOffice.filter((e) => e.floor === null);
  const remote = entries.filter((e) => e.status === 'remote');

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg md:text-xl font-bold capitalize">{dateLabel}</h3>
          <Link href={todayHref} className="no-underline">
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">Oggi</Button>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link href={prevHref} className="no-underline">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Giorno precedente">
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <Link href={nextHref} className="no-underline">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Giorno successivo">
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-6">
          <DayPresenceList
            title={FLOOR_LABEL.seventh_floor}
            entries={seventh}
            myUserId={myUserId}
            date={date}
            emptyText="Nessuna presenza dichiarata sul 7° piano per questo giorno."
          />
          <DayPresenceList
            title={FLOOR_LABEL.second_floor}
            entries={second}
            myUserId={myUserId}
            date={date}
            emptyText="Nessuna presenza dichiarata sul 2° piano per questo giorno."
          />
          {noFloor.length > 0 ? (
            <DayPresenceList
              title="In ufficio · piano da definire"
              entries={noFloor}
              myUserId={myUserId}
              date={date}
              emptyText=""
            />
          ) : null}
          <DayPresenceList
            title="Da remoto"
            entries={remote}
            myUserId={myUserId}
            date={date}
            emptyText="Nessuna dichiarazione di lavoro da remoto."
          />
        </div>
      </div>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type SearchParams = { view?: string; month?: string; date?: string };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view: 'month' | 'day' = params.view === 'day' ? 'day' : 'month';

  const today = new Date();
  const todayIsoStr = isoDate(today);
  const selectedDate = parseDateParam(params.date, today);
  const selectedDateObj = new Date(selectedDate);
  const { year, month } =
    view === 'day'
      ? { year: selectedDateObj.getFullYear(), month: selectedDateObj.getMonth() }
      : parseMonthParam(params.month, today);

  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstWeekday);
  const end = new Date(start);
  end.setDate(end.getDate() + 41);

  const [counts, events, me, totalActiveRows] = await Promise.all([
    getMyMonthCounts(),
    getUpcomingOfficeEvents(),
    getCurrentUser(),
    db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.banned, false)),
  ]);
  const totalActive = totalActiveRows.length;

  const [dayPresences, dayEntries] = await Promise.all([
    view === 'month'
      ? getPresencesForRange(isoDate(start), isoDate(end))
      : Promise.resolve<MonthDayPresence[]>([]),
    view === 'day' ? getPresencesForDate(selectedDate) : Promise.resolve<PresenceEntry[]>([]),
  ]);

  const presencesByDate = new Map<string, MonthAttendee[]>(
    dayPresences.map((p) => [p.date, p.attendees]),
  );
  const { grid, monthLabel } = buildMonthGrid(year, month, todayIsoStr, presencesByDate, events);

  // Best day per Team Overlap
  const futureDays = grid.filter((c) => {
    if (!c.inMonth || c.date < todayIsoStr) return false;
    const dow = new Date(c.date).getDay();
    return dow >= 1 && dow <= 5;
  });
  const candidates = futureDays.length > 0 ? futureDays : grid.filter((c) => c.inMonth);
  const bestCell =
    candidates.reduce<DayCellMeta | null>((best, c) => {
      if (!best || c.attendees.length > best.attendees.length) return c;
      return best;
    }, null) ?? grid[0]!;
  const bestDayDate = new Date(bestCell.date);
  const bestDay = {
    date: bestCell.date,
    label: bestDayDate.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long',
    }),
    overlapPct:
      totalActive > 0 ? Math.round((bestCell.attendees.length / totalActive) * 100) : 0,
    attendees: bestCell.attendees,
    totalActive,
  };

  // Navigation hrefs
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const monthPrevHref = `/calendar?view=month&month=${monthQuery(prevMonth.getFullYear(), prevMonth.getMonth())}`;
  const monthNextHref = `/calendar?view=month&month=${monthQuery(nextMonth.getFullYear(), nextMonth.getMonth())}`;
  const monthTodayHref = `/calendar?view=month`;

  const dayPrev = new Date(selectedDateObj);
  dayPrev.setDate(dayPrev.getDate() - 1);
  const dayNext = new Date(selectedDateObj);
  dayNext.setDate(dayNext.getDate() + 1);
  const dayPrevHref = `/calendar?view=day&date=${isoDate(dayPrev)}`;
  const dayNextHref = `/calendar?view=day&date=${isoDate(dayNext)}`;
  const dayTodayHref = `/calendar?view=day&date=${todayIsoStr}`;

  const monthSwitcherHref = `/calendar?view=month${params.month ? `&month=${params.month}` : ''}`;
  const daySwitcherHref = `/calendar?view=day&date=${selectedDate}`;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-5 py-8 sm:px-6 md:px-8 md:py-12">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Eyebrow>Calendario presenze</Eyebrow>
            <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
              La tua settimana, dichiarata in due tap.
            </h1>
            <p className="text-base text-muted-foreground">
              Pattern ricorrente, override settimanali e gestione della disponibilità del team.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Switcher Mese/Giorno (icone) */}
            <div className="inline-flex border border-border rounded-md overflow-hidden bg-card">
              <Link href={monthSwitcherHref} className="no-underline">
                <button
                  aria-label="Vista mese"
                  className={cn(
                    'inline-flex size-9 items-center justify-center transition-colors',
                    view === 'month'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <CalendarX2 className="size-4" />
                </button>
              </Link>
              <Link href={daySwitcherHref} className="no-underline">
                <button
                  aria-label="Vista giorno"
                  className={cn(
                    'inline-flex size-9 items-center justify-center transition-colors',
                    view === 'day'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <ViewIcon className="size-4" />
                </button>
              </Link>
            </div>
            <Button variant="outline" size="default" className="hidden sm:inline-flex">
              <Filter className="size-4" />
              Filtra
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden" aria-label="Filtra">
              <Filter className="size-4" />
            </Button>
            <Button>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuova presenza</span>
              <span className="sm:hidden">Nuova</span>
            </Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <KpiCard icon={<HomeIcon className="size-4 sm:size-6" />} label="Pianificati"
            value={counts.planned} tone="rgba(232, 185, 49, 0.85)" />
          <KpiCard icon={<Hourglass className="size-4 sm:size-6" />} label="In sospeso"
            value={counts.pending} tone="#C73E44" />
          <KpiCard icon={<HomeIcon className="size-4 sm:size-6" />} label="Remoto"
            value={counts.remote} tone="#3D87C9" />
        </div>

        {/* Body */}
        <div className="grid gap-6 items-start lg:grid-cols-[1fr_320px]">
          {view === 'month' ? (
            <CalendarMonthGrid
              monthLabel={monthLabel}
              grid={grid}
              myUserId={me.id}
              prevHref={monthPrevHref}
              nextHref={monthNextHref}
              todayHref={monthTodayHref}
            />
          ) : (
            <DayView
              date={selectedDate}
              entries={dayEntries}
              myUserId={me.id}
              prevHref={dayPrevHref}
              nextHref={dayNextHref}
              todayHref={dayTodayHref}
            />
          )}
          <div className="flex flex-col gap-6">
            <TeamOverlapCard bestDay={bestDay} myUserId={me.id} />
            <UpcomingEventsCard events={events} />
          </div>
        </div>

        {/* Legenda (solo vista mese) */}
        {view === 'month' ? (
          <Card className="p-5 bg-muted/50">
            <div className="flex flex-wrap items-center gap-4">
              <Eyebrow>Legenda</Eyebrow>
              <div className="flex items-center gap-2">
                <span className="inline-block size-3.5 rounded-full border-2 border-primary bg-card" />
                <span className="text-xs text-muted-foreground">Avatar presenti (max 2 + counter)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-sm border"
                  style={{
                    backgroundColor: EVENT_STYLES.closure.bg,
                    borderColor: EVENT_STYLES.closure.color,
                  }}
                />
                <span className="text-xs text-muted-foreground">Chiusura sede</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-sm border"
                  style={{
                    backgroundColor: EVENT_STYLES.team_building.bg,
                    borderColor: EVENT_STYLES.team_building.color,
                  }}
                />
                <span className="text-xs text-muted-foreground">Evento team</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-sm border"
                  style={{
                    backgroundColor: EVENT_STYLES.event.bg,
                    borderColor: EVENT_STYLES.event.color,
                  }}
                />
                <span className="text-xs text-muted-foreground">Evento aziendale</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-sm border border-primary/60 bg-primary/15" />
                <span className="text-xs text-muted-foreground">Oggi</span>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
