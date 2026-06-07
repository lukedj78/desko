import { CheckCircle2, MailCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { auth } from '@desko/auth';

import { DeskoBrand } from '@/components/shared/brand/desko-brand';

export const metadata = { title: 'Verifica email' };
export const dynamic = 'force-dynamic'; // verifica è side-effect, no caching

/**
 * Async Server Component — verifica email server-side al primo render.
 *
 * Pattern canonico data-fetching skill: niente "use client", niente useEffect
 * + Client SDK call. Il token arriva via searchParams; chiamiamo
 * `auth.api.verifyEmail` direttamente sul server (nessuna seconda hop HTTP
 * verso /api/auth/verify-email) e renderizziamo il risultato sincrono.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let status: 'no-token' | 'success' | 'error';
  let errorMessage = '';

  if (!token) {
    status = 'no-token';
  } else {
    try {
      await auth.api.verifyEmail({ query: { token } });
      status = 'success';
    } catch (e) {
      status = 'error';
      errorMessage =
        e instanceof Error
          ? e.message
          : 'Verifica fallita. Il link potrebbe essere scaduto o già usato.';
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-[600px] flex flex-col gap-8">
        <div className="flex items-center justify-center">
          <DeskoBrand size="lg" wordmark />
        </div>

        {status === 'no-token' ? <NoTokenState /> : null}
        {status === 'success' ? <SuccessState /> : null}
        {status === 'error' ? <ErrorState message={errorMessage} /> : null}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stati statici — solo presentazione, nessun JS client
// ─────────────────────────────────────────────────────────────────────────────
function NoTokenState() {
  return (
    <Card>
      <CardContent className="p-6 md:p-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex size-16 items-center justify-center rounded-xl bg-primary/85 text-primary-foreground">
            <MailCheck className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>Verifica email</Eyebrow>
            <h1 className="font-sans text-xl md:text-2xl font-bold">
              Controlla la tua casella.
            </h1>
            <p className="text-sm text-muted-foreground">
              Ti abbiamo inviato un link di conferma. Clicca il pulsante nell&apos;email per
              attivare il tuo account. Il link scade tra 24 ore.
            </p>
          </div>
          <Link href="/login" className="no-underline">
            <Button variant="outline">Vai al login</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessState() {
  return (
    <Card>
      <CardContent className="p-6 md:p-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div
            className="inline-flex size-16 items-center justify-center rounded-xl bg-success text-success-foreground"
            style={{ boxShadow: '0 0 0 6px rgba(45, 122, 63, 0.12)' }}
          >
            <CheckCircle2 className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>Email verificata</Eyebrow>
            <h1 className="font-sans text-xl md:text-2xl font-bold">Tutto pronto.</h1>
            <p className="text-sm text-muted-foreground">
              Il tuo account è attivo. Ora puoi accedere e iniziare a dichiarare le tue
              presenze in ufficio.
            </p>
          </div>
          <Link href="/dashboard" className="no-underline">
            <Button size="lg">Vai alla dashboard</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 md:p-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex size-16 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
            <ShieldAlert className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>Verifica fallita</Eyebrow>
            <h1 className="font-sans text-xl md:text-2xl font-bold">Link non valido.</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/signup" className="no-underline">
              <Button variant="outline">Registrati di nuovo</Button>
            </Link>
            <Link href="/login" className="no-underline">
              <Button>Vai al login</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
