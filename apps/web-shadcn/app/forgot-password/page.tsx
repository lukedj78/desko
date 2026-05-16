'use client';

import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field } from '@/components/ui/field';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '').trim();

    if (!email) {
      setError('Inserisci la tua email aziendale.');
      return;
    }

    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      });
      if (result.error) {
        if (result.error.status === 429) {
          setError('Hai già richiesto un reset di recente. Aspetta qualche minuto.');
          return;
        }
      }
      setSubmittedEmail(email);
    });
  };

  if (submittedEmail) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6 md:p-8 text-center">
              <div className="flex flex-col items-center gap-6">
                <div
                  className="inline-flex size-16 items-center justify-center rounded-xl bg-success text-success-foreground"
                  style={{ boxShadow: '0 0 0 6px rgba(45, 122, 63, 0.12)' }}
                >
                  <MailCheck className="size-8" />
                </div>
                <div className="flex flex-col gap-2">
                  <Eyebrow>Email inviata</Eyebrow>
                  <h1 className="font-sans text-xl md:text-2xl font-bold leading-tight">
                    Controlla la tua casella.
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Se l&apos;email <strong>{submittedEmail}</strong> è registrata, riceverai
                    un link per reimpostare la password. Il link scade tra 1 ora.
                  </p>
                </div>
                <Link href="/login" className="no-underline">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="size-4" />
                    Torna al login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-lg">
            D
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Desko</h2>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 text-center">
                <Eyebrow>Reset password</Eyebrow>
                <h1 className="font-sans text-2xl md:text-3xl font-bold leading-tight tracking-[-0.4px]">
                  Hai dimenticato la password?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Inserisci la tua email. Ti invieremo un link per impostare una nuova
                  password.
                </p>
              </div>

              {error ? <Alert variant="destructive">{error}</Alert> : null}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field
                  id="forgot-email"
                  name="email"
                  label="Email aziendale"
                  type="email"
                  placeholder="tu@azienda.it"
                  autoComplete="email"
                  required
                  autoFocus
                />
                <Button type="submit" size="lg" className="w-full" disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Invia link di reset
                </Button>
              </form>

              <div className="flex justify-center">
                <Link href="/login" className="no-underline">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="size-4" />
                    Torna al login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
