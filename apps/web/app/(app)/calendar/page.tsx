import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ViewDayOutlinedIcon from '@mui/icons-material/ViewDayOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmployeeHoverCard } from '@/components/site/employee-hover-card';
import { Eyebrow } from '@/components/site/eyebrow';
import { getCurrentUser } from '@/lib/auth-server';

import { MyPresenceItem } from './_components/my-presence-item';
import { db } from '@/lib/db';
import { user as userTable } from '@/lib/db/schema';
import {
  getMyMonthCounts,
  getPresencesForDate,
  getPresencesForRange,
  getUpcomingOfficeEvents,
  type MonthAttendee,
  type MonthDayPresence,
  type PresenceEntry,
} from '@/lib/queries/presence';
import type { Floor } from '@/lib/presence-domain';

export const metadata = { title: 'Calendar' };
export const dynamic = 'force-dynamic';

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

function attendeeToEntry(
  a: MonthAttendee,
  date: string,
  isMe: boolean,
): PresenceEntry {
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

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

const MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

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

function buildMonthGrid(
  year: number,
  month: number,
  todayIsoStr: string,
  presencesByDate: Map<string, MonthAttendee[]>,
  events: Array<{ date: string; kind: string; title: string }>,
): { grid: DayCellMeta[]; monthLabel: string; rangeStart: Date; rangeEnd: Date } {
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

  const end = new Date(start);
  end.setDate(end.getDate() + 41);

  return {
    grid,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
    rangeStart: start,
    rangeEnd: end,
  };
}

/**
 * Palette degli eventi — usata sia nelle celle del calendar (badge desktop +
 * pallino mobile) sia nella lista "Prossimi eventi" della sidebar.
 * Un solo set di colori = connessione visiva immediata tra le due viste.
 */
const EVENT_STYLES: Record<EventKind, { bg: string; color: string; dot: string }> = {
  closure: {
    bg: 'rgba(199, 62, 68, 0.12)',
    color: '#8B2229',
    dot: '#C73E44', // error
  },
  team_building: {
    bg: 'rgba(45, 122, 63, 0.15)',
    color: '#1F5630',
    dot: '#2D7A3F', // success
  },
  event: {
    bg: 'rgba(232, 185, 49, 0.18)',
    color: '#5A4500',
    dot: '#E8B931', // primary (ocra)
  },
};

// ─── KPI ─────────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 2 }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Box
          sx={{
            width: { xs: 32, sm: 44 },
            height: { xs: 32, sm: 44 },
            borderRadius: 1.5,
            backgroundColor: tone,
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& svg': { fontSize: { xs: 18, sm: 24 } },
          }}
        >
          {icon}
        </Box>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: { xs: 10, sm: 12 },
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 800,
              fontSize: { xs: 22, sm: 28 },
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

// ─── Calendar mese (vista invariata, solo navigabile) ────────────────────────

function CalendarMonthGrid({
  monthLabel,
  grid,
  myUserId,
  prevHref,
  nextHref,
  todayHref,
}: {
  monthLabel: string;
  grid: DayCellMeta[];
  myUserId: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      {/* Header del mese */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: 18, md: 22 }, textTransform: 'capitalize' }}
          >
            {monthLabel}
          </Typography>
          <Link href={todayHref} style={{ textDecoration: 'none' }}>
            <Button
              size="small"
              variant="outlined"
              sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: 12 }}
            >
              Oggi
            </Button>
          </Link>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Link href={prevHref} style={{ textDecoration: 'none' }}>
            <IconButton size="small" aria-label="Mese precedente">
              <ChevronLeftIcon />
            </IconButton>
          </Link>
          <Link href={nextHref} style={{ textDecoration: 'none' }}>
            <IconButton size="small" aria-label="Mese successivo">
              <ChevronRightIcon />
            </IconButton>
          </Link>
        </Stack>
      </Stack>

      {/* Header giorni della settimana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {DAY_LABELS.map((label, idx) => (
          <Box
            key={label}
            sx={{
              py: 1,
              textAlign: 'center',
              fontFamily: 'var(--font-jetbrains)',
              fontSize: 11,
              fontWeight: 600,
              color: idx >= 5 ? 'text.disabled' : 'text.secondary',
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      {/* Grid — gridAutoRows fissa per garantire celle di altezza uguale */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: { xs: '88px', md: '108px' },
        }}
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
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 0.75, md: 1.25 },
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:nth-of-type(7n)': { borderRight: 'none' },
                  backgroundColor: cell.isToday
                    ? 'rgba(232, 185, 49, 0.08)'
                    : !cell.inMonth || isWeekend
                    ? 'background.default'
                    : 'background.paper',
                  opacity: cell.inMonth ? 1 : 0.4,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover': {
                    backgroundColor: cell.isToday
                      ? 'rgba(232, 185, 49, 0.16)'
                      : 'action.hover',
                  },
                }}
              >
                <Stack spacing={0.75} sx={{ height: '100%' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: 'var(--font-inter)',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: 13,
                          fontWeight: cell.isToday ? 700 : 500,
                          color: cell.isToday
                            ? 'primary.dark'
                            : cell.inMonth
                            ? 'text.primary'
                            : 'text.disabled',
                        }}
                      >
                        {cell.day}
                      </Typography>
                      {/* Pallino colorato accanto al giorno — colore matchato
                          con la lista "Prossimi eventi" della sidebar.
                          Hover desktop: title nativo mostra il nome. */}
                      {eventStyle && cell.eventLabel ? (
                        <Box
                          component="span"
                          title={cell.eventLabel}
                          sx={{
                            display: 'inline-flex',
                            width: { xs: 8, md: 10 },
                            height: { xs: 8, md: 10 },
                            borderRadius: '50%',
                            backgroundColor: eventStyle.dot,
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                    </Stack>
                    {cell.isToday ? (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                        }}
                      />
                    ) : null}
                  </Stack>


                  {/* Avatar group dei presenti — allineato a destra, overlap
                      effettivo -10px (avatars stretti tra loro), bordo ocra.
                      Counter "+N" come testo a destra (NON dentro l'AvatarGroup)
                      per evitare che venga coperto dall'overlap. */}
                  {attendees.length > 0 ? (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ mt: 'auto', justifyContent: 'flex-end' }}
                    >
                      <AvatarGroup
                        spacing={10}
                        sx={{
                          flexShrink: 0,
                          '& .MuiAvatar-root': {
                            width: { xs: 22, md: 26 },
                            height: { xs: 22, md: 26 },
                            fontSize: { xs: 9, md: 10 },
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        {attendees.slice(0, 2).map((a, i) => {
                          const isMe = a.userId === myUserId;
                          return (
                            <EmployeeHoverCard
                              key={`${a.userId}-${i}`}
                              entry={attendeeToEntry(a, cell.date, isMe)}
                              isMe={isMe}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: isMe ? 'primary.main' : 'background.default',
                                  color: isMe ? 'primary.contrastText' : 'text.primary',
                                  cursor: isMe ? 'default' : 'pointer',
                                }}
                              >
                                {a.initials}
                              </Avatar>
                            </EmployeeHoverCard>
                          );
                        })}
                      </AvatarGroup>
                      {attendees.length > 2 ? (
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-jetbrains)',
                            fontWeight: 700,
                            fontSize: { xs: 10, md: 11 },
                            color: 'text.secondary',
                          }}
                        >
                          +{attendees.length - 2}
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Card>
  );
}

// ─── Card sidebar (invariate, layout originale) ──────────────────────────────

function TeamOverlapCard({
  bestDay,
  myUserId,
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
  const overlapPct = bestDay.overlapPct;
  const VISIBLE_LIMIT = 4;
  const visible = bestDay.attendees.slice(0, VISIBLE_LIMIT);
  const overflow = Math.max(0, bestDay.attendees.length - VISIBLE_LIMIT);

  return (
    <Card sx={{ p: 3, textAlign: 'center' }}>
      <Stack spacing={2.5} alignItems="center">
        <Stack alignItems="center" spacing={0.5}>
          <GroupsOutlinedIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
          <Eyebrow>Team Overlap</Eyebrow>
          <Typography
            variant="h4"
            sx={{ fontSize: 18, textTransform: 'capitalize' }}
          >
            {bestDay.label}
          </Typography>
        </Stack>

        <Box sx={{ position: 'relative', width: 140, height: 140, mx: 'auto' }}>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(var(--desko-palette-primary-main) 0% ${overlapPct}%, var(--desko-palette-divider) ${overlapPct}% 100%)`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 800,
                fontSize: 32,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {overlapPct}%
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {bestDay.attendees.length === 0
            ? 'Nessuna presenza dichiarata per questo giorno.'
            : `${bestDay.attendees.length} colleghi su ${bestDay.totalActive} saranno in ufficio.`}
        </Typography>

        {bestDay.attendees.length > 0 ? (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <AvatarGroup
              spacing={10}
              sx={{
                '& .MuiAvatar-root': {
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  border: '2px solid',
                  borderColor: 'primary.main',
                },
              }}
            >
              {visible.map((a) => {
                const isMe = a.userId === myUserId;
                return (
                  <EmployeeHoverCard
                    key={a.userId}
                    entry={attendeeToEntry(a, bestDay.date, isMe)}
                    isMe={isMe}
                  >
                    <Avatar
                      sx={{
                        bgcolor: isMe ? 'primary.main' : 'background.default',
                        color: isMe ? 'primary.contrastText' : 'text.primary',
                        cursor: isMe ? 'default' : 'pointer',
                      }}
                    >
                      {a.initials}
                    </Avatar>
                  </EmployeeHoverCard>
                );
              })}
            </AvatarGroup>
            {overflow > 0 ? (
              <Typography
                sx={{
                  fontFamily: 'var(--font-jetbrains)',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'text.secondary',
                }}
              >
                +{overflow} altri
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        <Link
          href={`/calendar?view=day&date=${bestDay.date}`}
          style={{ textDecoration: 'none', display: 'block', width: '100%' }}
        >
          <Button variant="outlined" fullWidth size="medium">
            Vedi dettagli team
          </Button>
        </Link>
      </Stack>
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

  const kindMeta: Record<string, { color: string; icon: ReactNode }> = {
    closure: { color: EVENT_STYLES.closure.dot, icon: <EventBusyOutlinedIcon fontSize="small" /> },
    team_building: { color: EVENT_STYLES.team_building.dot, icon: <GroupsOutlinedIcon fontSize="small" /> },
    event: { color: EVENT_STYLES.event.dot, icon: <CalendarMonthOutlinedIcon fontSize="small" /> },
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Eyebrow>Prossimi eventi</Eyebrow>
        <Stack>
          {events.map((e, idx) => {
            const fmt = dateFmt(e.date);
            const meta = kindMeta[e.kind] ?? kindMeta.event!;
            return (
              <Link
                key={e.date + e.title}
                href={`/calendar?view=day&date=${e.date}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    py: 1,
                    borderTop: idx === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                    mt: idx === 0 ? 0 : 0.5,
                    pt: idx === 0 ? 1 : 1.5,
                    '&:hover': { backgroundColor: 'action.hover', borderRadius: 1 },
                  }}
                >
                  {/* Pallino colorato (stesso colore del calendar) per
                      connessione visiva calendario ↔ lista eventi */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: meta.color,
                      flexShrink: 0,
                    }}
                  />
                  <Stack
                    alignItems="center"
                    sx={{
                      minWidth: 44,
                      p: 0.75,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontWeight: 700,
                        fontSize: 10,
                        color: 'text.secondary',
                      }}
                    >
                      {fmt.month}
                    </Typography>
                    <Typography sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                      {fmt.day}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {e.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                      {e.location}
                    </Typography>
                  </Stack>
                  <Box sx={{ color: meta.color, flexShrink: 0 }}>{meta.icon}</Box>
                </Stack>
              </Link>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

// ─── Vista giorno (nuova) ────────────────────────────────────────────────────

const FLOOR_LABEL: Record<Floor, string> = {
  seventh_floor: '7° Piano · stanza',
  second_floor: '2° Piano · co-working',
};

function DayPresenceList({
  title,
  entries,
  myUserId,
  date,
  emptyText,
}: {
  title: string;
  entries: PresenceEntry[];
  myUserId: string;
  date: string;
  emptyText: string;
}) {
  // Header con titolo + counter come chip, condiviso da empty/list
  const header = (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
      <Eyebrow>{title}</Eyebrow>
      <Box
        sx={{
          minWidth: 22,
          height: 22,
          px: 0.75,
          borderRadius: 999,
          backgroundColor: entries.length === 0 ? 'background.default' : 'primary.main',
          color: entries.length === 0 ? 'text.secondary' : 'primary.contrastText',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-jetbrains)',
          fontWeight: 700,
          fontSize: 11,
          border: entries.length === 0 ? '1px solid' : 'none',
          borderColor: 'divider',
        }}
      >
        {entries.length}
      </Box>
    </Stack>
  );

  if (entries.length === 0) {
    return (
      <Box>
        {header}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {header}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {entries.map((p) => {
          const isMe = p.userId === myUserId;

          // Card "tu": componente client interattivo con menu azioni.
          if (isMe) {
            return <MyPresenceItem key={p.userId} entry={p} date={date} />;
          }

          return (
            <EmployeeHoverCard key={p.userId} entry={p} isMe={false}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  // Width fissa: tutti gli item della stessa larghezza.
                  width: { xs: '100%', sm: 240, md: 260 },
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 1.5,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'background-color 120ms ease, border-color 120ms ease',
                  '&:hover': {
                    backgroundColor: 'background.default',
                    borderColor: 'text.secondary',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    fontSize: 12,
                    fontWeight: 700,
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  {p.initials}
                </Avatar>
                <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                    noWrap
                  >
                    {p.displayName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                    noWrap
                  >
                    {p.team ?? '—'}
                  </Typography>
                </Stack>
              </Stack>
            </EmployeeHoverCard>
          );
        })}
      </Box>
    </Box>
  );
}

function DayView({
  date,
  entries,
  myUserId,
  prevHref,
  nextHref,
  todayHref,
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const inOffice = entries.filter((e) => e.status === 'in_office');
  const seventh = inOffice.filter((e) => e.floor === 'seventh_floor');
  const second = inOffice.filter((e) => e.floor === 'second_floor');
  const noFloor = inOffice.filter((e) => e.floor === null);
  const remote = entries.filter((e) => e.status === 'remote');

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: 18, md: 22 }, textTransform: 'capitalize' }}
          >
            {dateLabel}
          </Typography>
          <Link href={todayHref} style={{ textDecoration: 'none' }}>
            <Button
              size="small"
              variant="outlined"
              sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: 12 }}
            >
              Oggi
            </Button>
          </Link>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Link href={prevHref} style={{ textDecoration: 'none' }}>
            <IconButton size="small" aria-label="Giorno precedente">
              <ChevronLeftIcon />
            </IconButton>
          </Link>
          <Link href={nextHref} style={{ textDecoration: 'none' }}>
            <IconButton size="small" aria-label="Giorno successivo">
              <ChevronRightIcon />
            </IconButton>
          </Link>
        </Stack>
      </Stack>

      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={3}>
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
        </Stack>
      </Box>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type SearchParams = {
  view?: string;
  month?: string;
  date?: string;
};

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
    db.select({ id: userTable.id }).from(userTable).where(eq(userTable.banned, false)),
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

  const { grid, monthLabel } = buildMonthGrid(
    year,
    month,
    todayIsoStr,
    presencesByDate,
    events,
  );

  // Best day per Team Overlap card.
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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    overlapPct:
      totalActive > 0
        ? Math.round((bestCell.attendees.length / totalActive) * 100)
        : 0,
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
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={5}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Eyebrow>Calendario presenze</Eyebrow>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 700,
                fontSize: { xs: 28, md: 36 },
                lineHeight: 1.1,
                letterSpacing: '-0.4px',
              }}
            >
              La tua settimana, dichiarata in due tap.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Pattern ricorrente, override settimanali e gestione della disponibilità del team.
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              gap: 1,
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
            {/* Switcher Mese / Giorno (icone) */}
            <Box
              sx={{
                display: 'inline-flex',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: 'background.paper',
              }}
            >
              <Link href={monthSwitcherHref} style={{ textDecoration: 'none' }}>
                <IconButton
                  size="medium"
                  aria-label="Vista mese"
                  sx={{
                    borderRadius: 0,
                    backgroundColor: view === 'month' ? 'primary.main' : 'transparent',
                    color: view === 'month' ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: view === 'month' ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ViewModuleOutlinedIcon fontSize="small" />
                </IconButton>
              </Link>
              <Link href={daySwitcherHref} style={{ textDecoration: 'none' }}>
                <IconButton
                  size="medium"
                  aria-label="Vista giorno"
                  sx={{
                    borderRadius: 0,
                    backgroundColor: view === 'day' ? 'primary.main' : 'transparent',
                    color: view === 'day' ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: view === 'day' ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ViewDayOutlinedIcon fontSize="small" />
                </IconButton>
              </Link>
            </Box>

            {/* Filtra: icona su mobile, button con label su sm+ */}
            <IconButton
              size="medium"
              aria-label="Filtra"
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <FilterAltOutlinedIcon fontSize="small" />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<FilterAltOutlinedIcon />}
              size="medium"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Filtra
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="medium"
              sx={{ flexShrink: 0, ml: 'auto' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Nuova presenza
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Nuova
              </Box>
            </Button>
          </Stack>
        </Stack>

        {/* KPI top */}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 2 },
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          <KpiCard
            icon={<HomeWorkOutlinedIcon />}
            label="Pianificati"
            value={counts.planned}
            tone="rgba(232, 185, 49, 0.85)"
          />
          <KpiCard
            icon={<HourglassEmptyOutlinedIcon />}
            label="In sospeso"
            value={counts.pending}
            tone="#C73E44"
          />
          <KpiCard
            icon={<HomeWorkOutlinedIcon />}
            label="Remoto"
            value={counts.remote}
            tone="#3D87C9"
          />
        </Box>

        {/* Body: vista mese o giorno + sidebar */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' },
            alignItems: 'start',
          }}
        >
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
          <Stack spacing={3}>
            <TeamOverlapCard bestDay={bestDay} myUserId={me.id} />
            <UpcomingEventsCard events={events} />
          </Stack>
        </Box>

        {/* Legenda — solo in vista mese (la vista giorno non ha bisogno) */}
        {view === 'month' ? (
          <Card sx={{ p: 2.5, backgroundColor: 'background.default' }}>
            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2 }} alignItems="center">
              <Eyebrow>Legenda</Eyebrow>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Avatar dei presenti (max 2 + counter)
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    backgroundColor: EVENT_STYLES.closure.bg,
                    border: `1px solid ${EVENT_STYLES.closure.color}`,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Chiusura sede
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    backgroundColor: EVENT_STYLES.team_building.bg,
                    border: `1px solid ${EVENT_STYLES.team_building.color}`,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Evento team
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    backgroundColor: EVENT_STYLES.event.bg,
                    border: `1px solid ${EVENT_STYLES.event.color}`,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Evento aziendale
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    backgroundColor: 'rgba(232, 185, 49, 0.2)',
                    border: '1px solid #5A4500',
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Oggi
                </Typography>
              </Stack>
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
