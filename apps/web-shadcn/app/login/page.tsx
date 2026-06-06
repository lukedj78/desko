'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { Field } from '@desko/ui/components/field';
import { MicrosoftIcon } from '@/components/shared/auth/microsoft-icon';
import { PasswordField } from '@/components/shared/auth/password-field';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [microsoftPending, setMicrosoftPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    startTransition(async () => {
      const { error: err } = await signIn.email({ email, password });
      if (err) {
        setError(err.message ?? 'Credenziali non valide.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  };

  const handleMicrosoftLogin = async () => {
    setError(null);
    setMicrosoftPending(true);
    try {
      const result = await signIn.social({
        provider: 'microsoft',
        callbackURL: '/dashboard',
      });
      if (result.error) {
        setError(
          result.error.message ?? 'Microsoft non ancora configurato. Usa email e password.',
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore Microsoft login.');
    } finally {
      setMicrosoftPending(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-[600px] flex flex-col gap-8">
        {/* Brand */}
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
                <Eyebrow>Accedi</Eyebrow>
                <h1 className="font-sans text-2xl md:text-3xl font-bold leading-tight tracking-[-0.4px]">
                  Bentornato.
                </h1>
                <p className="text-sm text-muted-foreground">
                  Accedi con il tuo account aziendale Microsoft o con email e password.
                </p>
              </div>

              {error ? <Alert variant="destructive">{error}</Alert> : null}

              {/* Microsoft */}
              <Button
                onClick={handleMicrosoftLogin}
                disabled={microsoftPending || pending}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {microsoftPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MicrosoftIcon className="size-4" />
                )}
                Continua con Microsoft
              </Button>

              {/* Divider con label */}
              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">oppure</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Email + password */}
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                <Field
                  id="login-email"
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="tu@azienda.it"
                  autoComplete="email"
                  required
                />
                <PasswordField
                  id="login-password"
                  name="password"
                  label="Password"
                  placeholder="La tua password"
                  autoComplete="current-password"
                  required
                  hint={
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground underline hover:text-foreground"
                    >
                      Password dimenticata?
                    </Link>
                  }
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={pending || microsoftPending}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Accedi
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Non hai ancora un account?{' '}
                <Link href="/signup" className="font-semibold text-foreground underline">
                  Registrati
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center font-mono text-xs tracking-[0.02em] text-muted-foreground">
          Tool interno · accesso riservato ai dipendenti
        </p>
      </div>
    </main>
  );
}
