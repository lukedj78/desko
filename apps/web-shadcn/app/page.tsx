import {
  ArrowRight,
  CalendarRange,
  EyeOff,
  Layers,
  Lock,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';

export const metadata = {
  title: 'Desko · Sai chi sarà in ufficio quando ci sarai tu',
  description:
    'Tool interno per dichiarare e consultare le presenze in ufficio. Privacy-first, volontario, niente controllo.',
};

// Icona Microsoft inline (lucide non la include con il logo a 4 quadrati)
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M0 0h11v11H0z" fill="#F25022" />
      <path d="M12 0h11v11H12z" fill="#7FBA00" />
      <path d="M0 12h11v11H0z" fill="#00A4EF" />
      <path d="M12 12h11v11H12z" fill="#FFB900" />
    </svg>
  );
}

const FEATURES: Array<{
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}> = [
  {
    icon: <CalendarRange className="size-5" />,
    eyebrow: 'Pianifica',
    title: 'Dichiari in due tap.',
    body:
      'Imposta i giorni in cui sarai in ufficio dal mobile, anche con un pattern ricorrente. Stop al "vado e vediamo".',
  },
  {
    icon: <Users className="size-5" />,
    eyebrow: 'Coordina',
    title: 'Vedi chi ci sarà.',
    body:
      'Lista colleghi presenti raggruppata per piano, filtrabile per team o follower. Niente più viaggi vanificati.',
  },
  {
    icon: <Layers className="size-5" />,
    eyebrow: 'Sposta',
    title: 'Cambia piano live.',
    body:
      'Sei al 7° ma scendi al 2° per pranzo? Sposta il tuo piano in un tap, i colleghi che ti seguono lo vedono entro 30 secondi.',
  },
  {
    icon: <EyeOff className="size-5" />,
    eyebrow: 'Decidi',
    title: 'Tu controlli chi vede.',
    body:
      "Tutti, solo il tuo team, solo chi ti segue, oppure modalità incognito. Diritto all'oblio sul passato esposto come pulsante.",
  },
];

const HOW_STEPS: Array<{ step: string; title: string; body: string }> = [
  {
    step: '01',
    title: 'Accedi col tuo account aziendale',
    body: 'Login Microsoft Entra ID o email/password. Niente nuovi account da gestire.',
  },
  {
    step: '02',
    title: 'Imposta il tuo pattern',
    body: 'Dichiari le giornate ricorrenti (es. martedì + giovedì) o vai per singolo giorno.',
  },
  {
    step: '03',
    title: 'Apri Desko prima del treno',
    body: 'Vedi se vale la pena venire. Se sì, sei pronto. Se no, lavori da casa.',
  },
];

function FeatureCard({ icon, eyebrow, title, body }: (typeof FEATURES)[number]) {
  return (
    <Card className="h-full">
      <CardContent className="p-6 md:p-7 pt-6 md:pt-7">
        <div className="flex flex-col gap-4">
          <div className="inline-flex size-11 items-center justify-center rounded-lg bg-primary/85 text-primary-foreground">
            {icon}
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HowItWorksStep({ step, title, body }: (typeof HOW_STEPS)[number]) {
  return (
    <div className="flex items-start gap-6">
      <span className="shrink-0 min-w-[56px] font-mono text-4xl font-bold leading-none text-primary-foreground">
        {step}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-base text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background">
      {/* TopBar minimale */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-5 py-4 sm:px-6 md:px-8">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold text-base">
              D
            </span>
            <span className="text-lg font-extrabold tracking-tight text-foreground">Desko</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/showcase" className="hidden sm:inline-flex no-underline">
              <Button variant="ghost" size="sm">
                Design system
              </Button>
            </Link>
            <Link href="/login" className="no-underline">
              <Button variant="ghost" size="sm">
                Accedi
              </Button>
            </Link>
            <Link href="/signup" className="no-underline">
              <Button size="sm">Inizia ora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-screen-2xl px-5 pt-16 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <div className="flex flex-col gap-8">
          <Eyebrow>Desko · Sede Milano</Eyebrow>
          <h1 className="font-sans text-[44px] font-extrabold leading-[0.95] tracking-[-2px] text-foreground sm:text-[56px] md:text-[80px] md:max-w-[14ch]">
            Sai chi sarà in ufficio quando ci sarai tu.
          </h1>
          <p className="max-w-[60ch] text-base text-muted-foreground md:text-lg">
            Strumento informativo, volontario, privacy-first. Dichiari le tue presenze in due tap,
            vedi i colleghi del tuo team a colpo d&apos;occhio, ti sposti tra il 7° e il 2° piano
            live. <strong className="font-semibold text-foreground">Niente controllo, niente gamification.</strong>
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/signup" className="no-underline">
              <Button size="lg" className="w-full sm:w-auto">
                Inizia ora
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login" className="no-underline">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <MicrosoftIcon className="size-4" />
                Continua con Microsoft
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 pt-4">
            {[
              { value: '50–150', label: 'Dipendenti per azienda' },
              { value: '2 tap', label: 'Per dichiarare presenza' },
              { value: '0 tracking', label: 'Niente geofencing, niente badge' },
            ].map((stat) => (
              <div key={stat.label} className="flex min-w-[120px] flex-col gap-0.5">
                <span className="font-sans text-2xl font-extrabold tracking-[-0.5px]">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-screen-2xl px-5 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="flex flex-col gap-12">
            <div className="flex max-w-[60ch] flex-col gap-3">
              <Eyebrow>Cosa fa Desko</Eyebrow>
              <h2 className="font-sans text-[32px] font-bold leading-[1.05] tracking-[-1px] md:text-5xl">
                Quattro cose, fatte bene.
              </h2>
              <p className="text-base text-muted-foreground">
                Pianifica, coordina, sposta, decidi chi vede. Niente di più.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted">
        <div className="mx-auto w-full max-w-screen-2xl px-5 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="grid items-start gap-12 md:grid-cols-[1fr_1.5fr] md:gap-20">
            <div className="flex flex-col gap-3">
              <Eyebrow>Come funziona</Eyebrow>
              <h2 className="font-sans text-[32px] font-bold leading-[1.05] tracking-[-0.8px] md:text-[44px]">
                Tre step, un minuto.
              </h2>
              <p className="text-base text-muted-foreground">
                Setup volontario, niente onboarding obbligatorio. Inizi dal mobile mentre sei in
                metro.
              </p>
            </div>
            <div className="flex flex-col">
              {HOW_STEPS.map((s, idx) => (
                <div key={s.step}>
                  {idx > 0 ? <div className="h-px bg-border my-5" /> : null}
                  <HowItWorksStep {...s} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy + tech band */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-screen-2xl px-5 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex flex-col gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-success text-success-foreground">
                  <Lock className="size-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">GDPR-first</h3>
                <p className="text-sm text-muted-foreground">
                  Minimizzazione, retention 90 giorni, diritto all&apos;oblio. Niente tracking
                  abitudini lavorative al di fuori del tuo consenso.
                </p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-col gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MicrosoftIcon className="size-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Microsoft Entra ID</h3>
                <p className="text-sm text-muted-foreground">
                  SSO con il tuo account aziendale + MFA via Microsoft Authenticator. Nessuna
                  password locale da ricordare.
                </p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-col gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-info text-info-foreground">
                  <Users className="size-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Per HR, non per controllo</h3>
                <p className="text-sm text-muted-foreground">
                  Vista aggregata anonimizzata con k-anonymity ≥5. Decisioni su spazi e giornate
                  tematiche senza monitorare le persone.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="border-t border-border"
        style={{
          background:
            'linear-gradient(135deg, rgba(232,185,49,0.18) 0%, rgba(232,185,49,0.05) 100%)',
        }}
      >
        <div className="mx-auto w-full max-w-[900px] px-5 py-16 text-center sm:px-6 md:px-8 md:py-24">
          <div className="flex flex-col items-center gap-6">
            <Eyebrow>Inizia adesso</Eyebrow>
            <h2 className="font-sans text-[32px] font-extrabold leading-none tracking-[-1.4px] md:text-[56px]">
              Una giornata in ufficio merita un team.
            </h2>
            <p className="max-w-[50ch] text-base text-muted-foreground">
              Smetti di fare il viaggio alla cieca. Apri Desko, vedi il segnale, decidi.
            </p>
            <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
              <Link href="/signup" className="no-underline w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:min-w-[200px] bg-foreground text-background hover:bg-foreground/90"
                >
                  Crea il tuo account
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login" className="no-underline w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:min-w-[200px]">
                  Accedi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-screen-2xl px-5 py-8 sm:px-6 md:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-6 items-center justify-center rounded bg-primary text-primary-foreground font-extrabold text-xs">
                D
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                Desko · tool interno
              </span>
            </div>
            <div className="flex flex-wrap gap-6">
              <Link
                href="/showcase"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
              >
                Design system
              </Link>
              <Link
                href="/login"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
              >
                Accedi
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
