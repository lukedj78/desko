'use client';

import { CheckCircle2, Hourglass, Loader2, MailCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { authClient } from '@/lib/auth-client';

type Status = 'pending' | 'no-token' | 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'no-token');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const { error } = await authClient.verifyEmail({ query: { token } });
      if (cancelled) return;
      if (error) {
        setErrorMessage(
          error.message ?? 'Verifica fallita. Il link potrebbe essere scaduto o già usato.',
        );
        setStatus('error');
      } else {
        setStatus('success');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'no-token') {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex size-16 items-center justify-center rounded-xl bg-primary/85 text-primary-foreground">
              <MailCheck className="size-8" />
            </div>
            <div className="flex flex-col gap-2">
              <Eyebrow>Verifica email</Eyebrow>
              <h1 className="font-sans text-xl md:text-2xl font-bold">Controlla la tua casella.</h1>
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

  if (status === 'verifying') {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex size-16 items-center justify-center rounded-xl bg-muted border border-border text-foreground">
              <Hourglass className="size-7" />
            </div>
            <div className="flex flex-col gap-2">
              <Eyebrow>Verifica in corso</Eyebrow>
              <h1 className="font-sans text-xl md:text-2xl font-bold">
                Stiamo confermando la tua email…
              </h1>
              <p className="text-sm text-muted-foreground">Solo un secondo.</p>
            </div>
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
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
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
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

export default function VerifyEmailPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-[600px] flex flex-col gap-8">
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-lg">
            D
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Desko</h2>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  );
}
