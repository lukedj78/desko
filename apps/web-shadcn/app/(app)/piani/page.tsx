import { Armchair, CheckCircle2, Coffee, SplitSquareVertical, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EmployeeHoverCard } from '@/components/site/employee-hover-card';
import { FLOOR_META, type Floor } from '@desko/domain';
import {
  getFloorOccupancy,
  getMyPresenceToday,
  getPresencesForDate,
  type PresenceEntry,
} from '@desko/queries/presence';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Piani' };
export const dynamic = 'force-dynamic';

const FLOOR_VISUALS: Record<
  Floor,
  { icon: ReactNode; tagline: string; bullets: string[] }
> = {
  seventh_floor: {
    icon: <Armchair className="size-8" />,
    tagline: 'Stanza tradizionale con scrivanie individuali, focus zone e sale meeting.',
    bullets: ['Scrivanie individuali', 'Focus zone silenziose', '2 sale meeting'],
  },
  second_floor: {
    icon: <Coffee className="size-8" />,
    tagline: 'Ambiente co-working aperto con bar interno, lounge e tavoli condivisi.',
    bullets: ['Co-working aperto', 'Bar interno + lounge', 'Tavoli condivisi'],
  },
};

function FloorCard({
  floor,
  presentCount,
  capacity,
  byTeam,
  recentPeople,
  isMine,
}: {
  floor: Floor;
  presentCount: number;
  capacity: number;
  byTeam: Array<{ team: string; count: number }>;
  recentPeople: PresenceEntry[];
  isMine: boolean;
}) {
  const meta = FLOOR_META[floor];
  const visuals = FLOOR_VISUALS[floor];
  const pct = Math.round((presentCount / Math.max(capacity, 1)) * 100);
  const status =
    pct < 50
      ? { label: 'Disponibile', tone: 'bg-success/15 text-success' }
      : pct < 80
      ? { label: 'Si riempie', tone: 'bg-warning/15 text-warning' }
      : { label: 'Quasi pieno', tone: 'bg-destructive/15 text-destructive' };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {/* Header banner */}
      <div
        className={cn(
          'px-6 py-7 border-b border-border min-h-[200px] flex flex-col gap-4',
          floor === 'seventh_floor' ? 'bg-muted' : 'bg-primary/85 text-primary-foreground',
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'inline-flex size-12 items-center justify-center rounded-lg',
                floor === 'seventh_floor'
                  ? 'bg-card text-foreground'
                  : 'bg-primary-foreground/15 text-primary-foreground',
              )}
            >
              {visuals.icon}
            </div>
            <div>
              <Eyebrow
                className={cn(
                  floor === 'seventh_floor'
                    ? 'text-muted-foreground'
                    : 'text-primary-foreground/80',
                )}
              >
                {meta.shortLabel} · {floor === 'seventh_floor' ? 'stanza' : 'co-working'}
              </Eyebrow>
              <h3 className="text-2xl font-bold leading-tight">{meta.label}</h3>
            </div>
          </div>
          {isMine ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-success-foreground shrink-0">
              <CheckCircle2 className="size-3" />
              Sei qui
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            'text-sm',
            floor === 'seventh_floor'
              ? 'text-muted-foreground'
              : 'text-primary-foreground/90',
          )}
        >
          {visuals.tagline}
        </p>
        <ul className="flex flex-wrap gap-2">
          {visuals.bullets.map((b) => (
            <li
              key={b}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                floor === 'seventh_floor'
                  ? 'bg-card border border-border text-foreground'
                  : 'bg-primary-foreground/15 text-primary-foreground',
              )}
            >
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-6">
        {/* Capacity */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-sans text-3xl font-extrabold leading-none">
              {presentCount}
              <span className="text-base font-medium text-muted-foreground"> / {capacity}</span>
            </span>
            <span className="text-xs text-muted-foreground mt-1">colleghi presenti</span>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em]',
              status.tone,
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Bar */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full transition-all',
              pct < 50 ? 'bg-success' : pct < 80 ? 'bg-primary' : 'bg-destructive',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* By team */}
        {byTeam.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>Team al piano</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {byTeam.map((t) => (
                <span
                  key={t.team}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
                >
                  <span className="font-semibold">{t.team}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Recent people */}
        {recentPeople.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>Si sono spostati di recente</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {recentPeople.slice(0, 6).map((p) => (
                <EmployeeHoverCard key={p.userId} entry={p}>
                  <Avatar className="size-8 ring-2 ring-primary cursor-pointer">
                    <AvatarFallback className="bg-muted text-[11px] font-bold">
                      {p.initials}
                    </AvatarFallback>
                  </Avatar>
                </EmployeeHoverCard>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto">
          <Button variant="outline" className="w-full">
            <SplitSquareVertical className="size-4" />
            Spostati a {meta.shortLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default async function PianiPage() {
  const [occupancy, mine, todayPresences] = await Promise.all([
    getFloorOccupancy(),
    getMyPresenceToday(),
    getPresencesForDate(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Mappa piani · oggi</Eyebrow>
          <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
            Dove sono i colleghi.
          </h1>
          <p className="text-base text-muted-foreground">
            Confronto in tempo reale fra 7° piano (stanza) e 2° piano (co-working e bar).
          </p>
        </div>

        {/* Floor cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {(['seventh_floor', 'second_floor'] as Floor[]).map((floor) => {
            const data = occupancy.byFloor.find((f) => f.floor === floor);
            if (!data) return null;
            const recent = todayPresences.filter(
              (p) => p.floor === floor && p.status === 'in_office',
            );
            return (
              <FloorCard
                key={floor}
                floor={floor}
                presentCount={data.presentCount}
                capacity={data.capacity}
                byTeam={data.byTeam}
                recentPeople={recent}
                isMine={mine.floor === floor}
              />
            );
          })}
        </div>

        {/* Unspecified people */}
        {occupancy.unassignedCount > 0 ? (
          <Card className="p-5 bg-muted/30 border-dashed">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {occupancy.unassignedCount} in ufficio · piano non indicato
                </p>
                <p className="text-xs text-muted-foreground">
                  Colleghi che hanno dichiarato presenza ma non hanno specificato il piano.
                </p>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
