'use client';

import {
  Bell,
  Building2,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { FLOOR_META, type Floor } from '@desko/domain';
import { cn } from '@/lib/utils';

type Day = 'M' | 'T' | 'W' | 'TH' | 'F';
const DAYS: Array<{ key: Day; label: string }> = [
  { key: 'M', label: 'Lun' },
  { key: 'T', label: 'Mar' },
  { key: 'W', label: 'Mer' },
  { key: 'TH', label: 'Gio' },
  { key: 'F', label: 'Ven' },
];

type PresenceMode = 'office' | 'remote' | 'unspecified';
type Visibility = 'company' | 'team' | 'followers' | 'hidden';

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string; description: string; icon: React.ReactNode }> = [
  { value: 'company', label: 'Tutti i colleghi', description: 'Visibile a tutti dentro l\'azienda.', icon: <Building2 className="size-5" /> },
  { value: 'team', label: 'Solo il mio team', description: 'Visibile solo a chi ha il mio stesso team.', icon: <UserIcon className="size-5" /> },
  { value: 'followers', label: 'Solo chi mi segue', description: 'Visibile solo ai follower che hai accettato.', icon: <Eye className="size-5" /> },
  { value: 'hidden', label: 'Nascosta (incognito)', description: 'Nessuno vede le tue presenze.', icon: <EyeOff className="size-5" /> },
];

export default function ImpostazioniPage() {
  const [pattern, setPattern] = useState<Record<Day, PresenceMode>>({
    M: 'office',
    T: 'office',
    W: 'office',
    TH: 'remote',
    F: 'remote',
  });
  const [defaultFloor, setDefaultFloor] = useState<Floor>('seventh_floor');
  const [visibility, setVisibility] = useState<Visibility>('company');
  const [notifications, setNotifications] = useState({
    teamInOffice: true,
    lunchInvites: true,
    weeklyDigest: false,
  });

  const cyclePresence = (day: Day) => {
    setPattern((prev) => {
      const next = { ...prev };
      next[day] = prev[day] === 'office' ? 'remote' : prev[day] === 'remote' ? 'unspecified' : 'office';
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Impostazioni</Eyebrow>
          <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
            Profilo, presenze, privacy.
          </h1>
          <p className="text-base text-muted-foreground">
            Tutto quello che serve per coordinare il tuo modo di lavorare.
          </p>
        </div>

        {/* Profile */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <UserIcon className="size-5 text-muted-foreground" />
                <Eyebrow>Profilo</Eyebrow>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">SA</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-lg">Super Admin</p>
                  <p className="text-sm text-muted-foreground font-mono">admin@desko.local</p>
                </div>
                <Button variant="outline" size="sm">Cambia foto</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="profile-name" label="Nome completo" defaultValue="Super Admin" />
                <Field id="profile-team" label="Team" defaultValue="Operations" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly pattern */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Layers className="size-5 text-muted-foreground" />
                  <Eyebrow>Pattern settimanale</Eyebrow>
                </div>
                <Button variant="ghost" size="sm">Disattiva</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Imposta i giorni in cui sarai in ufficio in modo ricorrente. Override singoli giorni dal calendar.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {DAYS.map((d) => {
                  const mode = pattern[d.key];
                  return (
                    <button
                      key={d.key}
                      onClick={() => cyclePresence(d.key)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
                        mode === 'office' && 'bg-primary/15 border-primary text-foreground',
                        mode === 'remote' && 'bg-info/10 border-info/30 text-info',
                        mode === 'unspecified' && 'bg-muted border-border text-muted-foreground',
                      )}
                    >
                      <span className="text-xs font-bold">{d.label}</span>
                      <span className="text-[10px] uppercase tracking-wide">
                        {mode === 'office' ? 'In ufficio' : mode === 'remote' ? 'Remoto' : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Piano di default quando sei in ufficio</Label>
                <div className="flex gap-2">
                  {(['seventh_floor', 'second_floor'] as Floor[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDefaultFloor(f)}
                      className={cn(
                        'flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
                        defaultFloor === f
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      {FLOOR_META[f].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy / Visibility */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-muted-foreground" />
                <Eyebrow>Privacy presenze</Eyebrow>
              </div>
              <p className="text-sm text-muted-foreground">
                Decidi chi può vedere quando sei in ufficio. Vale sia per la dashboard sia per il calendar.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                      visibility === opt.value
                        ? 'border-primary bg-primary/8 ring-2 ring-primary/30'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex size-9 items-center justify-center rounded-lg shrink-0',
                        visibility === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {opt.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-muted-foreground" />
                <Eyebrow>Notifiche</Eyebrow>
              </div>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { key: 'teamInOffice', label: 'Il mio team è in ufficio', desc: 'Avviso quando ≥3 colleghi del team dichiarano presenza per oggi.' },
                    { key: 'lunchInvites', label: 'Inviti a pranzo', desc: 'Quando un collega ti invita a una proposta privata.' },
                    { key: 'weeklyDigest', label: 'Digest settimanale', desc: 'Riepilogo del lunedì mattina con chi sarà in ufficio nella settimana.' },
                  ] as const
                ).map((n) => (
                  <label
                    key={n.key}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      checked={notifications[n.key]}
                      onChange={(e) => setNotifications((prev) => ({ ...prev, [n.key]: e.target.checked }))}
                      className="mt-1 size-4 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Trash2 className="size-5 text-destructive" />
                <Eyebrow className="text-destructive">Diritto all&apos;oblio</Eyebrow>
              </div>
              <p className="text-sm text-muted-foreground">
                Cancella permanentemente lo storico delle tue presenze. L&apos;account resta attivo
                ma il passato viene rimosso (GDPR right-to-be-forgotten).
              </p>
              <div>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="size-4" />
                  Cancella storico presenze
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
