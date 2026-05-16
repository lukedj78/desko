import { ArrowUpRight, CheckCircle2, Layers, LogOut, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EmployeeHoverCard } from '@/components/site/employee-hover-card';
import { getCurrentUser } from '@desko/auth/server';
import {
  getFloorOccupancy,
  getMyPresenceToday,
  getPresencesForDate,
  getTodayCounts,
  type PresenceEntry,
} from '@desko/queries/presence';
import { FLOOR_META, type Floor } from '@desko/domain';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const formatTodayLabel = () =>
  new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const TEAM_COLORS: Record<string, string> = {
  Engineering: '#3D87C9',
  Product: '#2D7A3F',
  Marketing: '#C73E44',
  Sales: '#9C5BCC',
  HR: '#D4A625',
};

// ─────────────────────────────────────────────────────────────────────────────
// CheckInHeroCard
// ─────────────────────────────────────────────────────────────────────────────
function CheckInHeroCard({
  floor,
  lastFloorUpdateAt,
}: {
  floor: Floor | null;
  lastFloorUpdateAt: string | null;
}) {
  const otherFloor: Floor = floor === 'seventh_floor' ? 'second_floor' : 'seventh_floor';

  return (
    <Card className="flex h-full flex-col gap-5 p-5 md:p-7">
      {/* Riga 1: icon success + chip + check-in time */}
      <div className="flex items-center gap-4">
        <div
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-success text-success-foreground md:size-14"
          style={{ boxShadow: '0 0 0 4px rgba(45, 122, 63, 0.12)' }}
        >
          <CheckCircle2 className="size-[22px] md:size-7" />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="inline-flex h-[22px] items-center rounded-md bg-success px-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-success-foreground">
            PRESENZA ORA
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            check-in {formatTime(lastFloorUpdateAt)}
          </span>
        </div>
      </div>

      {/* Riga 2: title + body */}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-sans text-[22px] font-bold leading-[1.1] tracking-[-0.4px] md:text-[28px]">
          Check-in confermato
        </h2>
        <p className="text-sm text-muted-foreground">
          {floor
            ? `Stai lavorando al ${FLOOR_META[floor].label} — ${FLOOR_META[floor].description.toLowerCase()}.`
            : 'Sei in ufficio. Indica il piano per coordinarti coi colleghi.'}
        </p>
      </div>

      {/* Riga 3: 2 buttons stack/row */}
      <div className="mt-auto flex w-full flex-col gap-2.5 pt-2 sm:flex-row">
        <Button size="lg" className="flex-1 whitespace-nowrap">
          <ArrowLeftRight />
          Sposta al {FLOOR_META[otherFloor].shortLabel}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 whitespace-nowrap border-foreground/20 bg-transparent text-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut />
          Esci dall&apos;ufficio
        </Button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OccupancyHeroCard — gradient ocra + donut 120px
// ─────────────────────────────────────────────────────────────────────────────
function OccupancyHeroCard({
  floor,
  presentCount,
  capacity,
}: {
  floor: Floor;
  presentCount: number;
  capacity: number;
}) {
  const meta = FLOOR_META[floor];
  const pct = Math.round((presentCount / capacity) * 100);
  const toneClass =
    pct < 50 ? 'text-success' : pct < 80 ? 'text-primary' : 'text-destructive';
  const free = capacity - presentCount;

  return (
    <Card
      className="flex h-full flex-col gap-5 p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(232,185,49,0.18) 0%, rgba(232,185,49,0.05) 100%)',
        borderColor: 'rgba(232,185,49,0.4)',
      }}
    >
      {/* Header eyebrow + icon */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <Eyebrow>Occupazione piano</Eyebrow>
          <h4 className="font-sans text-[18px] font-bold leading-tight">{meta.label}</h4>
        </div>
        <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary-foreground">
          <Layers className="size-4" />
        </div>
      </div>

      {/* Donut + dati */}
      <div className="flex flex-1 items-center gap-5">
        <div className="relative size-[120px] shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(hsl(var(--primary)) 0% ${pct}%, rgba(14,15,12,0.08) ${pct}% 100%)`,
            }}
          />
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card">
            <span
              className={cn(
                'font-sans text-[32px] font-extrabold leading-none tracking-[-0.02em]',
                toneClass,
              )}
            >
              {pct}%
            </span>
            <span className="text-[11px] text-muted-foreground">pieno</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-[22px] font-extrabold leading-none">{free}</span>
            <span className="text-xs text-muted-foreground">postazioni libere</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {presentCount} colleghi presenti su {capacity} disponibili
          </span>
          <span
            className={cn(
              'font-mono text-[11px] font-semibold',
              toneClass,
            )}
          >
            {pct < 50 ? '↘ disponibile' : pct < 80 ? '→ si riempie' : '↗ quasi pieno'}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ColleagueHorizontalCard
// ─────────────────────────────────────────────────────────────────────────────
function ColleagueHorizontalCard({
  entry,
  isMe,
}: {
  entry: PresenceEntry;
  isMe?: boolean;
}) {
  const teamColor = entry.team ? TEAM_COLORS[entry.team] ?? '#868685' : '#868685';
  const floorChip =
    entry.floor === 'seventh_floor'
      ? { label: 'AL 7°', bg: 'rgba(45,122,63,0.15)', color: '#1F5630' }
      : entry.floor === 'second_floor'
        ? { label: 'AL 2°', bg: 'rgba(232,185,49,0.2)', color: '#5A4500' }
        : { label: 'N/A', bg: 'transparent', color: 'hsl(var(--muted-foreground))' };

  const avatar = (
    <Avatar
      className={cn(
        'size-14 shrink-0 text-lg font-bold',
        isMe ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      <AvatarFallback
        className={cn(
          'text-lg font-bold',
          isMe
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        {entry.initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <Card className="h-full p-4">
      <div className="flex min-w-0 items-center gap-4">
        <EmployeeHoverCard entry={entry} isMe={isMe}>
          {avatar}
        </EmployeeHoverCard>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-[15px] font-semibold leading-tight">
            {isMe ? 'Tu' : entry.displayName}
          </p>
          <div className="flex min-w-0 items-center gap-1.5">
            {entry.team ? (
              <span
                className="inline-block size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: teamColor }}
              />
            ) : null}
            <span className="truncate text-xs text-muted-foreground">
              {entry.team ?? '—'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span
              className="inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold uppercase tracking-[0.04em]"
              style={{ backgroundColor: floorChip.bg, color: floorChip.color }}
            >
              {floorChip.label}
            </span>
            {entry.isLastMinute ? (
              <span
                className="inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold uppercase tracking-[0.04em]"
                style={{
                  backgroundColor: 'rgba(232,185,49,0.2)',
                  color: '#5A4500',
                }}
              >
                LAST-MIN
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const [currentUser, presences, occupancy, counts, mine] = await Promise.all([
    getCurrentUser(),
    getPresencesForDate(),
    getFloorOccupancy(),
    getTodayCounts(),
    getMyPresenceToday(),
  ]);
  const firstName = currentUser.name.trim().split(/\s+/)[0] ?? currentUser.name;

  const myUserId = currentUser.id;
  const inOffice = presences.filter((p: PresenceEntry) => p.status === 'in_office');

  const myFloor: Floor = mine.floor ?? 'seventh_floor';
  const myFloorData =
    occupancy.byFloor.find((f) => f.floor === myFloor) ?? occupancy.byFloor[0]!;

  const kpis: Array<{ label: string; value: number; colorClass: string }> = [
    { label: 'In ufficio', value: counts.totalDeclared, colorClass: 'text-success' },
    { label: 'Last-minute', value: counts.lastMinute, colorClass: 'text-warning' },
    { label: 'In remoto', value: counts.remote, colorClass: 'text-info' },
    {
      label: 'Da pattern',
      value: counts.inOfficeFromPattern,
      colorClass: 'text-muted-foreground',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-5 py-8 sm:px-6 md:px-8 md:py-12">
      <div className="flex flex-col gap-8">
        {/* Welcome */}
        <div className="flex flex-col gap-2">
          <Eyebrow className="capitalize">{formatTodayLabel()}</Eyebrow>
          <h1 className="font-sans text-[28px] font-bold leading-[1.1] tracking-[-0.4px] md:text-[36px]">
            Bentornato, {firstName}.
          </h1>
          <p className="text-base text-muted-foreground">
            Ecco il riepilogo della tua giornata in ufficio.
          </p>
        </div>

        {/* Hero row: Check-in (2/3) + Occupancy (1/3) */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[2fr_1fr]">
          <CheckInHeroCard floor={mine.floor} lastFloorUpdateAt={mine.lastFloorUpdateAt} />
          <OccupancyHeroCard
            floor={myFloorData.floor}
            presentCount={myFloorData.presentCount}
            capacity={myFloorData.capacity}
          />
        </div>

        {/* Colleghi in ufficio */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-sans text-[20px] font-bold md:text-[22px]">
                Colleghi in ufficio
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                ({inOffice.length})
              </span>
            </div>
            <Link href="/calendar" className="no-underline">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                Vedi calendar settimanale
                <ArrowUpRight />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inOffice.slice(0, 8).map((entry: PresenceEntry) => (
              <ColleagueHorizontalCard
                key={entry.userId}
                entry={entry}
                isMe={entry.userId === myUserId}
              />
            ))}
          </div>
        </div>

        {/* Banner ocra "Apri vista piani" */}
        <Card
          className="grid overflow-hidden p-0 md:grid-cols-[2fr_1fr]"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--primary)) 0%, #F4C84A 60%, #E8B931 100%)',
            borderColor: 'transparent',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          <div className="flex flex-col gap-5 p-6 md:p-8">
            <Eyebrow className="text-primary-foreground/80">Vista per piano</Eyebrow>
            <h2 className="font-sans text-[26px] font-extrabold leading-[1.1] tracking-[-0.6px] text-primary-foreground md:text-[32px]">
              Apri la vista piani per coordinarti col team.
            </h2>
            <p className="text-sm" style={{ color: 'rgba(43, 31, 0, 0.75)' }}>
              Vedi capacità in tempo reale del 7° Piano (stanza) e del 2° Piano (co-working).
              Sposta il tuo piano in un tap, aggiorna i colleghi che ti seguono.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:w-auto">
              <Link href="/piani" className="no-underline sm:flex-1">
                <Button
                  size="lg"
                  className="w-full bg-foreground text-background hover:bg-foreground/90 sm:min-w-[200px]"
                >
                  Apri vista piani
                </Button>
              </Link>
              <Link href="/impostazioni" className="no-underline sm:flex-1">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-foreground bg-transparent text-foreground hover:bg-foreground/10 hover:text-foreground sm:min-w-[200px]"
                >
                  Imposta piano default
                </Button>
              </Link>
            </div>
          </div>
          <div
            className="hidden items-center justify-center p-8 md:flex"
            style={{ backgroundColor: 'rgba(43, 31, 0, 0.08)' }}
          >
            <div className="inline-flex size-[140px] items-center justify-center rounded-xl bg-primary-foreground text-primary">
              <Layers className="size-16" />
            </div>
          </div>
        </Card>

        {/* KPI strip */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {kpi.label}
                </span>
                <span
                  className={cn(
                    'font-sans text-[28px] font-extrabold leading-none',
                    kpi.colorClass,
                  )}
                >
                  {kpi.value}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
