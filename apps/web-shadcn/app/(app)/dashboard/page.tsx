import { CalendarRange, CheckCircle2, Home, Layers } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getCurrentUser } from '@desko/auth/server';
import {
  getFloorOccupancy,
  getMyPresenceToday,
  getPresencesForDate,
  getTodayCounts,
} from '@desko/queries/presence';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const formatTodayLabel = () =>
  new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

export default async function DashboardPage() {
  const [currentUser, mine, counts, occupancy, presences] = await Promise.all([
    getCurrentUser(),
    getMyPresenceToday(),
    getTodayCounts(),
    getFloorOccupancy(),
    getPresencesForDate(),
  ]);

  const firstName = currentUser.name.trim().split(/\s+/)[0] ?? currentUser.name;
  const inOffice = presences.filter((p: { status: string }) => p.status === 'in_office');

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-8">
        {/* Welcome */}
        <div className="flex flex-col gap-2">
          <Eyebrow className="capitalize">{formatTodayLabel()}</Eyebrow>
          <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
            Bentornato, {firstName}.
          </h1>
          <p className="text-base text-muted-foreground">
            Ecco il riepilogo della tua giornata in ufficio.
          </p>
        </div>

        {/* Check-in card */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-lg bg-success text-success-foreground">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-success">
                    Presenza ora
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {mine.status === 'in_office' ? 'check-in' : 'non in ufficio'}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {mine.status === 'in_office'
                    ? 'Check-in confermato'
                    : 'Non sei in ufficio oggi'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {mine.status === 'in_office'
                    ? 'Sei in ufficio. Indica il piano per coordinarti coi colleghi.'
                    : 'Apri il calendar per dichiarare una presenza.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {mine.status === 'in_office' ? (
                  <>
                    <Button size="lg" className="w-full sm:w-auto">
                      Sposta al {mine.floor === 'seventh_floor' ? '2°' : '7°'}
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Esci dall&apos;ufficio
                    </Button>
                  </>
                ) : (
                  <Link href="/calendar" className="no-underline">
                    <Button size="lg">Vai al calendar</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floor occupancy compact */}
        <div className="grid gap-4 sm:grid-cols-2">
          {occupancy.byFloor.map((f) => {
            const pct = Math.round((f.presentCount / Math.max(f.capacity, 1)) * 100);
            const free = Math.max(0, f.capacity - f.presentCount);
            return (
              <Card key={f.floor}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Layers className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <Eyebrow>Occupazione piano</Eyebrow>
                        <p className="font-bold text-lg">
                          {f.floor === 'seventh_floor' ? '7° Piano' : '2° Piano'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-extrabold">{pct}%</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        pieno
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <strong className="text-foreground">{free}</strong> postazioni libere ·{' '}
                    {f.presentCount} colleghi su {f.capacity} disponibili
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Colleagues count */}
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Home className="size-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm">
                <strong className="font-bold">{inOffice.length} colleghi in ufficio</strong>
                <span className="text-muted-foreground"> · {counts.remote} da remoto</span>
              </p>
            </div>
            <Link href="/calendar?view=day" className="no-underline">
              <Button variant="ghost" size="sm">
                <CalendarRange className="size-4" />
                Vedi calendar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
