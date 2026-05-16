import { Armchair, CheckCircle2, Coffee, SplitSquareVertical, Users, ArrowLeftRight } from 'lucide-react';
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
  { icon: ReactNode; label: string; tagline: string; bullets: string[] }
> = {
  seventh_floor: {
    icon: <Armchair className="size-8" />,
    label: 'STANZA TRADIZIONALE',
    tagline: 'Stanza tradizionale con scrivanie individuali, focus zone e sale meeting.',
    bullets: ['Scrivanie individuali', 'Focus zone silenziose', '2 sale meeting'],
  },
  second_floor: {
    icon: <Coffee className="size-8" />,
    label: 'CO-WORKING + BAR',
    tagline: 'Ambiente co-working aperto con bar interno, lounge e tavoli condivisi.',
    bullets: ['Co-working aperto', 'Bar interno + lounge', 'Tavoli condivisi'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FloorCard (port 1:1 da MUI)
// ─────────────────────────────────────────────────────────────────────────────
function FloorCard({
  floor,
  presentCount,
  capacity,
  byTeam,
  recentPeople,
  isMine,
  myUserId,
}: {
  floor: Floor;
  presentCount: number;
  capacity: number;
  byTeam: Array<{ team: string; count: number }>;
  recentPeople: PresenceEntry[];
  isMine: boolean;
  myUserId: string;
}) {
  const meta = FLOOR_META[floor];
  const visuals = FLOOR_VISUALS[floor];
  const pct = Math.round((presentCount / Math.max(capacity, 1)) * 100);
  const toneClass =
    pct < 50 ? 'bg-success' : pct < 80 ? 'bg-primary' : 'bg-destructive';
  const status =
    pct < 50
      ? { label: 'Disponibile', bg: 'bg-success', text: 'text-white' }
      : pct < 80
        ? { label: 'Si riempie', bg: 'bg-warning', text: 'text-primary-foreground' }
        : { label: 'Quasi pieno', bg: 'bg-destructive', text: 'text-white' };

  const isSecond = floor === 'second_floor';

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Header banner — altezza fissa per allineare le card affiancate */}
      <div
        className={cn(
          'flex flex-col gap-4 border-b border-border px-5 py-7 md:px-6',
          'min-h-[220px]',
          isSecond ? 'text-primary-foreground' : 'text-foreground',
        )}
        style={
          isSecond
            ? { backgroundColor: 'hsl(42 88% 64%)' /* primary.light ~ */ }
            : { backgroundColor: 'hsl(var(--muted))' }
        }
      >
        {/* Riga icona + titolo */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {visuals.icon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={cn(
                'font-mono text-[11px] font-semibold uppercase tracking-[0.06em] leading-tight',
                isSecond ? 'text-primary-foreground/80' : 'text-muted-foreground',
              )}
            >
              {visuals.label}
            </span>
            <h3 className="text-2xl font-bold leading-tight whitespace-nowrap">
              {meta.label}
            </h3>
          </div>
        </div>

        {/* Chips: Sei qui (opzionale) + status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isMine ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              <CheckCircle2 className="size-3.5" />
              Sei qui
            </span>
          ) : null}
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
              status.bg,
              status.text,
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Tagline pinned in basso */}
        <p
          className={cn(
            'mt-auto text-sm',
            isSecond ? 'text-primary-foreground/90' : 'text-muted-foreground',
          )}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {visuals.tagline}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-5 md:p-6">
        {/* Occupazione */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-3xl font-extrabold leading-none tracking-[-0.02em] md:text-[40px]">
                {presentCount}
              </span>
              <span className="text-sm text-muted-foreground">/ {capacity} postazioni</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all', toneClass)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Servizi disponibili — outlined chips */}
        <div className="flex flex-wrap gap-2">
          {visuals.bullets.map((b) => (
            <span
              key={b}
              className="inline-flex h-6 items-center rounded-full border border-border bg-card px-2.5 text-[11px] text-foreground"
            >
              {b}
            </span>
          ))}
        </div>

        {/* Team breakdown */}
        {byTeam.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>Team presenti</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {byTeam.map((t) => (
                <div
                  key={t.team}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold">{t.team}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nessuno qui in questo momento.
          </p>
        )}

        {/* Avatar group */}
        {recentPeople.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>Chi è qui ora</Eyebrow>
            <div className="flex items-center gap-3">
              <div className="flex flex-row-reverse items-center">
                {recentPeople
                  .slice(0, 6)
                  .reverse()
                  .map((p, i) => (
                    <EmployeeHoverCard
                      key={p.userId}
                      entry={p}
                      isMe={p.userId === myUserId}
                    >
                      <Avatar
                        className={cn(
                          'size-8 ring-2 ring-card',
                          i > 0 && '-mr-2',
                          p.userId === myUserId ? '' : 'cursor-pointer',
                        )}
                      >
                        <AvatarFallback
                          className={cn(
                            'text-[13px] font-bold',
                            p.userId === myUserId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground',
                          )}
                        >
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                    </EmployeeHoverCard>
                  ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {recentPeople.length} {recentPeople.length === 1 ? 'collega' : 'colleghi'}
              </span>
            </div>
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-auto">
          <Button
            size="lg"
            className="w-full"
            variant={isMine ? 'outline' : 'default'}
            disabled={isMine}
          >
            {isMine ? <CheckCircle2 /> : <ArrowLeftRight />}
            {isMine ? `Sei già al ${meta.label}` : `Sposta qui (${meta.label})`}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function PianiPage() {
  const [occupancy, presences, mine] = await Promise.all([
    getFloorOccupancy(),
    getPresencesForDate(),
    getMyPresenceToday(),
  ]);

  const myUserId = 'mb';
  const inOffice = presences.filter((p: PresenceEntry) => p.status === 'in_office');
  const seventh = inOffice.filter((p: PresenceEntry) => p.floor === 'seventh_floor');
  const second = inOffice.filter((p: PresenceEntry) => p.floor === 'second_floor');
  const unspecified = inOffice.filter((p: PresenceEntry) => p.floor === null);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-5 py-8 sm:px-6 md:px-8 md:py-12">
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Eyebrow>Piani · Sede Milano</Eyebrow>
          <h1 className="font-sans text-[28px] font-bold leading-[1.1] tracking-[-0.4px] md:text-[36px]">
            Dove stai lavorando oggi?
          </h1>
          <p className="max-w-[60ch] text-base text-muted-foreground">
            La sede ha due aree: il <strong className="font-bold text-foreground">7° Piano</strong> con
            stanza tradizionale e il <strong className="font-bold text-foreground">2° Piano</strong> con
            co-working e bar. Indica dove sei e spostati durante la giornata se cambia il tuo piano. È
            un riferimento informale per coordinarsi — <em>non desk booking</em>.
          </p>
        </div>

        {/* Summary band */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {occupancy.totalInOffice} colleghi in ufficio adesso
              </span>
              <span className="text-xs text-muted-foreground">
                {seventh.length} al 7° · {second.length} al 2° · {unspecified.length} non indicato
              </span>
            </div>
          </div>
          <div className="flex-1" />
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: 'hsl(42 88% 64%)',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <SplitSquareVertical className="size-3.5" />
            {mine.floor ? `Sei al ${FLOOR_META[mine.floor].label}` : 'Piano non indicato'}
          </span>
        </div>

        {/* Floor cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {occupancy.byFloor.map((f) => {
            const recentPeople = f.floor === 'seventh_floor' ? seventh : second;
            return (
              <FloorCard
                key={f.floor}
                floor={f.floor}
                presentCount={f.presentCount}
                capacity={f.capacity}
                byTeam={f.byTeam}
                recentPeople={recentPeople}
                isMine={mine.floor === f.floor}
                myUserId={myUserId}
              />
            );
          })}
        </div>

        {/* Unspecified panel */}
        {unspecified.length > 0 ? (
          <Card className="bg-muted p-5 md:p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Eyebrow>In ufficio · piano non indicato</Eyebrow>
                <span className="inline-flex h-5 items-center rounded-md bg-card px-1.5 text-[11px] font-bold text-foreground">
                  {unspecified.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Questi colleghi hanno dichiarato la presenza ma non hanno specificato il piano.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {unspecified.map((p: PresenceEntry) => (
                  <Card key={p.userId} className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-muted text-sm font-bold">
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.team ?? '—'}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
