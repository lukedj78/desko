'use client';

import {
  Bell,
  Eye,
  Loader2,
  Lock,
  MapPin,
  User,
  CalendarCheck,
} from 'lucide-react';
import * as React from 'react';
import { z } from 'zod';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card } from '@desko/ui/components/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@desko/ui/components/dialog';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { Field } from '@desko/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@desko/ui/components/select';
import { Switch } from '@desko/ui/components/switch';
import { FLOOR_META } from '@desko/domain';
import type { MyProfile, WeeklyPattern } from '@desko/queries/presence';
import {
  archivePastPresences,
  updateVisibility,
  updateWeeklyPattern,
} from '@desko/server-actions/presence';
import { cn } from '@desko/ui/lib/utils';

import { useEditForm } from '@/lib/forms';

// ─── Schema ──────────────────────────────────────────────────────────────────

const SettingsSchema = z.object({
  visibility: z.enum(['company', 'team', 'followers', 'hidden']),
  defaultFloor: z.enum(['seventh_floor', 'second_floor', 'none']),
  monday: z.boolean(),
  tuesday: z.boolean(),
  wednesday: z.boolean(),
  thursday: z.boolean(),
  friday: z.boolean(),
});

type SettingsValues = z.infer<typeof SettingsSchema>;

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
const DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'monday', label: 'Lun', short: 'L' },
  { key: 'tuesday', label: 'Mar', short: 'M' },
  { key: 'wednesday', label: 'Mer', short: 'M' },
  { key: 'thursday', label: 'Gio', short: 'G' },
  { key: 'friday', label: 'Ven', short: 'V' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MilanoSkylineHero — SVG inline (port 1:1 da MUI)
//
// NOTA: illustrazione decorativa specifica del brand Desko ("sole su Milano",
// palette ocra dello skyline al tramonto). I colori sono hardcoded di
// proposito — è artwork, non token. Quando il tema cambia (Corporate Blue,
// Nordic Minimal) questo SVG resta ocra perché rappresenta l'identità
// Milano-Desko. Per orgs custom serve un'illustrazione diversa (override
// futuro via DESIGN.md `illustrations.heroBackground`).
// ─────────────────────────────────────────────────────────────────────────────
function MilanoSkylineHero() {
  return (
    <div className="relative w-full min-h-[200px] md:min-h-[260px] overflow-hidden rounded-t-lg">
      <svg
        viewBox="0 0 800 280"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBEFD0" />
            <stop offset="50%" stopColor="#F4C84A" />
            <stop offset="100%" stopColor="#E8B931" />
          </linearGradient>
          <linearGradient id="bgBuildings" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7A5A12" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5A4500" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fgBuildings" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D2A00" />
            <stop offset="100%" stopColor="#2B1F00" />
          </linearGradient>
        </defs>

        <rect width="800" height="280" fill="url(#sky)" />

        {/* Sun */}
        <circle cx="640" cy="80" r="38" fill="#FFFFFF" opacity="0.45" />
        <circle cx="640" cy="80" r="22" fill="#FFFFFF" opacity="0.7" />

        {/* Background buildings */}
        <g fill="url(#bgBuildings)">
          <rect x="0" y="180" width="60" height="100" />
          <rect x="60" y="160" width="50" height="120" />
          <rect x="110" y="170" width="70" height="110" />
          <rect x="180" y="150" width="55" height="130" />
          <rect x="235" y="165" width="45" height="115" />
          <rect x="280" y="175" width="60" height="105" />
          <rect x="340" y="155" width="50" height="125" />
          <rect x="390" y="170" width="70" height="110" />
          <rect x="460" y="160" width="55" height="120" />
          <rect x="515" y="175" width="60" height="105" />
          <rect x="575" y="165" width="50" height="115" />
          <rect x="625" y="180" width="55" height="100" />
          <rect x="680" y="170" width="60" height="110" />
          <rect x="740" y="175" width="60" height="105" />
        </g>

        {/* Foreground skyline */}
        <g fill="url(#fgBuildings)">
          {/* Duomo */}
          <path d="M 60 280 L 60 220 L 70 220 L 70 200 L 80 200 L 80 180 L 90 180 L 90 160 L 95 145 L 100 160 L 100 180 L 110 180 L 110 200 L 120 200 L 120 220 L 130 220 L 130 280 Z" />

          {/* Galleria */}
          <rect x="150" y="200" width="80" height="80" />
          <path d="M 160 200 L 160 175 L 220 175 L 220 200 Z" />
          <circle cx="190" cy="180" r="12" fill="url(#sky)" opacity="0.4" />

          {/* Pirellone */}
          <rect x="270" y="120" width="40" height="160" />
          <rect x="278" y="125" width="3" height="150" fill="url(#sky)" opacity="0.3" />
          <rect x="290" y="125" width="3" height="150" fill="url(#sky)" opacity="0.3" />
          <rect x="302" y="125" width="3" height="150" fill="url(#sky)" opacity="0.3" />

          {/* Torre Velasca */}
          <rect x="350" y="180" width="40" height="100" />
          <path d="M 340 180 L 400 180 L 400 165 L 340 165 Z" />
          <rect x="360" y="135" width="20" height="30" />

          {/* Generic mid-rise */}
          <rect x="420" y="195" width="35" height="85" />
          <rect x="455" y="180" width="30" height="100" />

          {/* Bosco Verticale */}
          <rect x="510" y="100" width="36" height="180" />
          <rect x="558" y="130" width="36" height="150" />
          {[
            [515, 130], [528, 145], [540, 160], [515, 175], [528, 190], [540, 205], [515, 220], [528, 235], [540, 250],
            [563, 145], [576, 160], [588, 175], [563, 190], [576, 205], [588, 220], [563, 235], [576, 250],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#2D7A3F" opacity="0.65" />
          ))}

          {/* UniCredit Tower */}
          <rect x="620" y="80" width="32" height="200" />
          <path d="M 636 80 L 636 50 L 640 50 L 640 80 Z" />

          {/* Last cluster */}
          <rect x="680" y="190" width="40" height="90" />
          <rect x="720" y="200" width="35" height="80" />
          <rect x="755" y="185" width="40" height="95" />
        </g>
      </svg>

      {/* Tag overlay top-right */}
      <span
        className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
      >
        HQ · Milano
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BentoCard helper
// ─────────────────────────────────────────────────────────────────────────────
function BentoCard({
  title,
  icon,
  description,
  action,
  spanMd = 1,
  children,
  noPadding,
}: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  spanMd?: 1 | 2;
  children?: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden',
        spanMd === 2 ? 'md:col-span-2' : '',
      )}
    >
      <div className={cn('px-5 pt-5 md:px-6 md:pt-6', noPadding ? 'pb-0' : '')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
              {icon}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h4 className="text-[17px] font-bold leading-tight">{title}</h4>
              {description ? (
                <span className="text-xs text-muted-foreground">{description}</span>
              ) : null}
            </div>
          </div>
          {action}
        </div>
      </div>
      {children ? (
        <div
          className={cn(
            'flex flex-1 flex-col',
            noPadding ? 'p-0' : 'p-5 pt-5 md:p-6 md:pt-6',
          )}
        >
          {children}
        </div>
      ) : null}
    </Card>
  );
}

function RecurringDayToggle({
  active,
  onToggle,
  label,
  short,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  short: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={`${label} ${active ? 'attivo' : 'inattivo'}`}
        className={cn(
          'inline-flex size-11 items-center justify-center rounded-md md:size-12',
          'border font-sans text-sm font-bold transition-all',
          'hover:scale-[1.02] active:scale-[0.98]',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-foreground hover:border-foreground/40',
        )}
      >
        {short}
      </button>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ArchiveHistoryDialog — diritto all'oblio (US-5, GDPR).
// Fuori dal form: azione destructive fire-and-forget con conferma esplicita.
// ─────────────────────────────────────────────────────────────────────────────
function ArchiveHistoryDialog({
  onDone,
}: {
  onDone: (message: string, ok: boolean) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await archivePastPresences();
      if (res.ok) {
        onDone(
          res.data.archivedCount > 0
            ? `Eliminate ${res.data.archivedCount} presenze passate dallo storico.`
            : 'Nessuna presenza passata da eliminare.',
          true,
        );
        setOpen(false);
      } else {
        onDone(res.message ?? 'Errore nella cancellazione dello storico.', false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Cancella
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancellare lo storico presenze?</DialogTitle>
          <DialogDescription>
            Tutte le tue presenze dichiarate nei giorni passati verranno eliminate
            definitivamente (diritto all&apos;oblio, GDPR). Le dichiarazioni di oggi e
            future restano invariate. L&apos;operazione non è reversibile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annulla</Button>} />
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Elimina storico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserSettingsForm — sezioni personali della pagina /settings.
// Wrappata da app/(app)/settings/page.tsx (Server Component) che legge
// profilo + pattern e monta anche <ThemePickerCard /> per admin.
//
// Edit form (skill `forms`): Save esplicito gated su dirty+valid, baseline
// reset on success. Un solo Save salva pattern settimanale (updateWeeklyPattern)
// e visibilità (updateVisibility).
// ─────────────────────────────────────────────────────────────────────────────
export function UserSettingsForm({
  profile,
  pattern,
}: {
  profile: MyProfile;
  pattern: WeeklyPattern;
}) {
  // Esito dell'azione GDPR (fuori dal form: nessun impatto su dirty state)
  const [archiveNotice, setArchiveNotice] = React.useState<{
    message: string;
    ok: boolean;
  } | null>(null);

  const { form, formError, resetToBaseline } = useEditForm<SettingsValues>({
    schema: SettingsSchema,
    defaultValues: {
      visibility: profile.visibility,
      defaultFloor: pattern.defaultFloor ?? 'none',
      monday: pattern.monday === 'in_office',
      tuesday: pattern.tuesday === 'in_office',
      wednesday: pattern.wednesday === 'in_office',
      thursday: pattern.thursday === 'in_office',
      friday: pattern.friday === 'in_office',
    },
    save: async (value) => {
      const [patternRes, visibilityRes] = await Promise.all([
        updateWeeklyPattern({
          monday: value.monday ? 'in_office' : 'unspecified',
          tuesday: value.tuesday ? 'in_office' : 'unspecified',
          wednesday: value.wednesday ? 'in_office' : 'unspecified',
          thursday: value.thursday ? 'in_office' : 'unspecified',
          friday: value.friday ? 'in_office' : 'unspecified',
          defaultFloor: value.defaultFloor === 'none' ? null : value.defaultFloor,
        }),
        updateVisibility({ visibility: value.visibility }),
      ]);
      if (!patternRes.ok) {
        throw new Error(patternRes.message ?? 'Errore nel salvataggio del pattern.');
      }
      if (!visibilityRes.ok) {
        throw new Error(visibilityRes.message ?? 'Errore nel salvataggio della visibilità.');
      }
      return value;
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-10"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Eyebrow>Profilo · Privacy · Notifiche</Eyebrow>
        <h1 className="font-sans text-[28px] font-bold leading-[1.1] tracking-[-0.4px] md:text-[36px]">
          Profilo e Impostazioni.
        </h1>
        <p className="text-base text-muted-foreground">
          Gestisci le tue informazioni personali e le preferenze di ufficio.
        </p>
      </div>

        {/* Bento grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* ROW 1 — Informazioni personali (span 2) + Sicurezza (span 1) */}
          <BentoCard
            title="Informazioni personali"
            icon={<User className="size-4" />}
            description="Sincronizzate da Entra ID, in sola lettura."
            spanMd={2}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="settings-name"
                label="Nome completo"
                defaultValue={profile.name}
                hint="da Entra ID"
                disabled
              />
              <Field
                id="settings-email"
                label="Email aziendale"
                defaultValue={profile.email}
                hint="readonly"
                disabled
              />
              <Field
                id="settings-team"
                label="Team"
                defaultValue={profile.team ?? '—'}
                hint="assegnato dall'amministratore"
                disabled
              />
              <Field
                id="settings-department"
                label="Dipartimento"
                defaultValue={profile.department ?? '—'}
                hint="assegnato dall'amministratore"
                disabled
              />
            </div>
          </BentoCard>

          <BentoCard
            title="Sicurezza"
            icon={<Lock className="size-4" />}
            description="Sessioni e accesso."
            action={
              <Button variant="outline" size="sm" type="button">
                Esci da tutti
              </Button>
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted p-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded bg-success text-sm font-bold text-success-foreground">
                  ✓
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-semibold">Authenticator attivo</span>
                  <span className="text-xs text-muted-foreground">MFA via Entra ID</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted p-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded border border-border bg-card text-foreground">
                  <Lock className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-semibold">Ultimo accesso</span>
                  <span className="text-xs text-muted-foreground">08:42 da Milano · macOS</span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* ROW 2 — Giorni ricorrenti (span 1) + Sede HQ HERO (span 2) */}
          <BentoCard
            title="Giorni ricorrenti in ufficio"
            icon={<CalendarCheck className="size-4" />}
            description="Pattern settimanale automatico."
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <form.Field key={d.key} name={d.key}>
                    {(field) => (
                      <RecurringDayToggle
                        active={Boolean(field.state.value)}
                        onToggle={() => field.handleChange(!field.state.value)}
                        label={d.label}
                        short={d.short}
                      />
                    )}
                  </form.Field>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="default-floor" className="text-sm font-medium">
                  Piano preferito
                </label>
                <form.Field name="defaultFloor">
                  {(field) => (
                    <Select
                      value={String(field.state.value)}
                      onValueChange={(v) =>
                        v && field.handleChange(v as SettingsValues['defaultFloor'])
                      }
                    >
                      <SelectTrigger id="default-floor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seventh_floor">
                          {FLOOR_META.seventh_floor.label} · stanza
                        </SelectItem>
                        <SelectItem value="second_floor">
                          {FLOOR_META.second_floor.label} · co-working
                        </SelectItem>
                        <SelectItem value="none">Nessuno (decido ogni volta)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
                <span className="text-xs text-muted-foreground">
                  Pre-selezionato quando dichiari presenza.
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Sede HQ HERO con skyline Milano */}
          <Card className="flex flex-col overflow-hidden p-0 md:col-span-2">
            <MilanoSkylineHero />
            <div className="flex flex-col gap-5 p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Eyebrow>Sede di riferimento</Eyebrow>
                  <h3 className="font-sans text-2xl font-bold leading-tight md:text-[28px]">
                    Milano HQ
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Via Tortona, 30 — 20144 Milano · Lombardia, IT
                  </p>
                </div>
                <MapPin className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 text-primary-foreground">
                  <span className="text-xs font-bold">7° Piano</span>
                  <span className="text-xs opacity-85">stanza tradizionale</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                  <span className="text-xs font-bold">2° Piano</span>
                  <span className="text-xs text-muted-foreground">co-working + bar</span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Posti totali', value: '70' },
                  { label: 'Sale meeting', value: '4' },
                  { label: 'Bar interno', value: '2°' },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-md border border-border bg-muted p-3"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {kpi.label}
                    </span>
                    <p className="font-sans text-xl font-bold leading-none mt-1">{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ROW 3 — Visibilità (span 1) + Notifiche (span 2) */}
          <BentoCard
            title="Visibilità presenze"
            icon={<Eye className="size-4" />}
            description="Chi vede i tuoi giorni in ufficio."
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="visibility" className="text-sm font-medium">
                  Chi può vedere
                </label>
                <form.Field name="visibility">
                  {(field) => (
                    <Select
                      value={String(field.state.value)}
                      onValueChange={(v) =>
                        v && field.handleChange(v as SettingsValues['visibility'])
                      }
                    >
                      <SelectTrigger id="visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Tutti i colleghi</SelectItem>
                        <SelectItem value="team">Solo il mio team</SelectItem>
                        <SelectItem value="followers">Solo chi mi segue</SelectItem>
                        <SelectItem value="hidden">Modalità incognito</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
                <span className="text-xs text-muted-foreground">
                  Si applica anche allo storico.
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-dashed border-destructive bg-muted p-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-semibold">Cancella storico</span>
                  <span className="text-xs text-muted-foreground">
                    Diritto all&apos;oblio (GDPR)
                  </span>
                </div>
                <ArchiveHistoryDialog
                  onDone={(message, ok) => setArchiveNotice({ message, ok })}
                />
              </div>
              {archiveNotice ? (
                <Alert variant={archiveNotice.ok ? 'default' : 'destructive'}>
                  {archiveNotice.message}
                </Alert>
              ) : null}
            </div>
          </BentoCard>

          <BentoCard
            title="Notifiche"
            icon={<Bell className="size-4" />}
            description="Cosa ricevi via Teams o email. Presto disponibile."
            spanMd={2}
          >
            <div className="flex flex-col gap-2">
              {[
                {
                  key: 'teamInOffice',
                  title: 'Quando il mio team è in ufficio',
                  desc: 'Avviso quando 3+ membri del team confermano la stessa giornata.',
                },
                {
                  key: 'floorUpdates',
                  title: 'Cambi di piano dei colleghi seguiti',
                  desc: 'Avviso quando una persona che segui si sposta tra 7° e 2°.',
                },
                {
                  key: 'weeklyReminder',
                  title: 'Reminder settimanale',
                  desc: 'Domenica sera ti invitiamo a confermare la settimana entrante.',
                },
              ].map((n) => (
                <div
                  key={n.key}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted p-4 opacity-70"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.desc}</span>
                  </div>
                  {/* Backend notifiche non ancora implementato (PLAN-NEXT fase 3):
                      switch disabilitati finché non esiste persistenza reale. */}
                  <Switch checked={false} disabled aria-label={`${n.title} (presto disponibile)`} />
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        {/* Save bar */}
        <Card className="p-5">
          <div className="flex flex-col gap-3">
            {formError ? <Alert variant="destructive">{formError.message}</Alert> : null}
            <form.Subscribe
              selector={(s) => [s.isDirty, s.canSubmit, s.isSubmitting] as const}
            >
              {([isDirty, canSubmit, isSubmitting]) => (
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">
                      {isDirty ? 'Modifiche non salvate' : 'Tutto salvato'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pattern, piano preferito e visibilità richiedono salvataggio esplicito.
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!isDirty || isSubmitting}
                      onClick={resetToBaseline}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" disabled={!isDirty || !canSubmit}>
                      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                      {isSubmitting ? 'Salvataggio…' : 'Salva tutte le modifiche'}
                    </Button>
                  </div>
                </div>
              )}
            </form.Subscribe>
          </div>
        </Card>
    </form>
  );
}
