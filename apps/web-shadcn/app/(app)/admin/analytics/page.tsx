import { redirect } from 'next/navigation';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getSession } from '@desko/auth/server';
import { getHrAnalyticsSummary } from '@desko/queries/hr-analytics';
import { cn } from '@/lib/utils';

export const metadata = { title: 'HR analytics' };
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = new Set(['admin', 'hr_analytics']);

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!ALLOWED_ROLES.has(role)) redirect('/dashboard');

  const summary = await getHrAnalyticsSummary();
  const t = summary.today;
  const dateLabel = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(t.date));

  // Bar chart per weekday
  const maxValue = Math.max(
    1,
    ...summary.weekday.map((d) => d.inOfficeAvg),
    Math.ceil(t.totalActiveUsers * 0.6),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Admin · HR analytics</Eyebrow>
          <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
            Presenza ufficio, in aggregato.
          </h1>
          <p className="text-base text-muted-foreground">
            Solo numeri, mai nomi. Aggregati con cap minimo 3 persone per evitare di risalire
            al singolo collega da combinazioni granulari.
          </p>
        </div>

        <Alert variant="info">
          <strong>Privacy first.</strong> Questa pagina è visibile a chi ha ruolo{' '}
          <code className="font-mono text-xs">admin</code> o{' '}
          <code className="font-mono text-xs">hr_analytics</code>. Nessun dato esposto è
          per-utente: tutto è conteggio o media.
        </Alert>

        {/* Oggi KPI */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Oggi</h2>
            <span className="text-xs text-muted-foreground capitalize">{dateLabel}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'In ufficio', value: t.inOfficeTotal, hint: `${t.inOfficePct}% degli attivi (${t.totalActiveUsers})` },
              { label: '7° piano · stanza', value: t.inOfficeBySeventh, hint: 'dichiarazioni oggi' },
              { label: '2° piano · co-working', value: t.inOfficeBySecond, hint: 'dichiarazioni oggi' },
              { label: 'Da remoto', value: t.remoteTotal, hint: `${t.unspecifiedTotal} non dichiarati` },
            ].map((k) => (
              <Card key={k.label} className="p-4 md:p-5">
                <Eyebrow>{k.label}</Eyebrow>
                <p className="font-sans text-2xl md:text-3xl font-bold leading-none mt-2 tracking-[-0.5px]">
                  {k.value}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{k.hint}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Weekday bars */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Per giorno della settimana</h2>
            <span className="text-xs text-muted-foreground">
              Media giornaliera · ultime 4 settimane
            </span>
          </div>
          <Card className="p-5 md:p-6">
            <div
              className="grid grid-cols-5 gap-3 md:gap-6 items-end"
              style={{ minHeight: 220 }}
            >
              {summary.weekday.map((d) => {
                const heightPct = (d.inOfficeAvg / maxValue) * 100;
                return (
                  <div
                    key={d.weekday}
                    className="flex flex-col items-center justify-end gap-2 h-full"
                  >
                    <span className="font-mono text-xs font-bold">
                      {d.suppressed ? '—' : d.inOfficeAvg}
                    </span>
                    <div
                      className={cn(
                        'w-full min-h-1 rounded-md transition-all',
                        d.suppressed
                          ? 'border border-dashed border-border'
                          : 'bg-gradient-to-b from-primary to-primary/70',
                      )}
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold">{d.weekdayLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.suppressed ? 'soglia' : `${d.inOfficePct}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Weekly trend */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Trend settimanale</h2>
            <span className="text-xs text-muted-foreground">
              Totale presenze in ufficio · ultime 8 settimane
            </span>
          </div>
          <Card className="p-0 overflow-hidden">
            {summary.weekly.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nessun dato disponibile sulle ultime 8 settimane.
              </p>
            ) : (
              <div className="flex flex-col">
                {summary.weekly.map((w, idx) => {
                  const max = Math.max(...summary.weekly.map((x) => x.inOfficeTotal));
                  const widthPct = max > 0 ? (w.inOfficeTotal / max) * 100 : 0;
                  const start = new Date(w.weekStart);
                  const end = new Date(start);
                  end.setDate(end.getDate() + 4);
                  const fmt = (d: Date) =>
                    new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(d);
                  return (
                    <div
                      key={w.isoWeek}
                      className={cn(
                        'flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 px-6 py-3',
                        idx > 0 && 'border-t border-border',
                      )}
                    >
                      <div className="sm:min-w-[180px]">
                        <p className="text-sm font-semibold">
                          {fmt(start)} – {fmt(end)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{w.isoWeek}</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-3 sm:min-w-[200px] sm:justify-end">
                        <span className="font-mono text-lg font-bold">{w.inOfficeTotal}</span>
                        <span className="text-xs text-muted-foreground">
                          {w.uniqueUsers} {w.uniqueUsers === 1 ? 'persona' : 'persone'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
