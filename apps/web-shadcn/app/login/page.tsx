'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { Field } from '@desko/ui/components/field';
import { DeskoBrand } from '@/components/shared/brand/desko-brand';
import { MicrosoftIcon } from '@/components/shared/auth/microsoft-icon';
import { PasswordField } from '@/components/shared/auth/password-field';
import { signIn } from '@/lib/auth-client';
import { useCreateForm } from '@/lib/forms';

const LoginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta'),
});

type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [microsoftPending, setMicrosoftPending] = useState(false);
  const [microsoftError, setMicrosoftError] = useState<string | null>(null);

  // Email/password login — gestito da useCreateForm (skill forms compliant)
  const { form, formError } = useCreateForm<LoginInput, void>({
    schema: LoginSchema,
    defaultValues: { email: '', password: '' },
    submit: async ({ email, password }) => {
      const { error } = await signIn.email({ email, password });
      if (error) throw new Error(error.message ?? 'Credenziali non valide.');
    },
    onSuccess: () => {
      router.push('/dashboard');
      router.refresh();
    },
  });

  // Microsoft SSO — handler isolato (no form fields, no toolkit overhead)
  const handleMicrosoftLogin = async () => {
    setMicrosoftError(null);
    setMicrosoftPending(true);
    try {
      const result = await signIn.social({
        provider: 'microsoft',
        callbackURL: '/dashboard',
      });
      if (result.error) {
        setMicrosoftError(
          result.error.message ?? 'Microsoft non ancora configurato. Usa email e password.',
        );
      }
    } catch (e) {
      setMicrosoftError(e instanceof Error ? e.message : 'Errore Microsoft login.');
    } finally {
      setMicrosoftPending(false);
    }
  };

  const displayError = microsoftError ?? formError?.message ?? null;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-[600px] flex flex-col gap-8">
        <div className="flex items-center justify-center">
          <DeskoBrand size="lg" wordmark />
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

              {displayError ? <Alert variant="destructive">{displayError}</Alert> : null}

              {/* Microsoft SSO */}
              <Button
                onClick={handleMicrosoftLogin}
                disabled={microsoftPending || form.state.isSubmitting}
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

              {/* Email + password form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void form.handleSubmit();
                }}
                className="flex flex-col gap-4"
              >
                <form.Field name="email">
                  {(field) => (
                    <Field
                      id="login-email"
                      label="Email"
                      type="email"
                      placeholder="tu@azienda.it"
                      autoComplete="email"
                      required
                      value={String(field.state.value ?? '')}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                      }
                    />
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <PasswordField
                      id="login-password"
                      label="Password"
                      placeholder="La tua password"
                      autoComplete="current-password"
                      required
                      value={String(field.state.value ?? '')}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                      }
                      hint={
                        <Link
                          href="/forgot-password"
                          className="text-muted-foreground underline hover:text-foreground"
                        >
                          Password dimenticata?
                        </Link>
                      }
                    />
                  )}
                </form.Field>

                <form.Subscribe
                  selector={(s) => ({
                    canSubmit: s.canSubmit,
                    isSubmitting: s.isSubmitting,
                  })}
                >
                  {({ canSubmit, isSubmitting }) => (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={!canSubmit || microsoftPending}
                    >
                      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                      Accedi
                    </Button>
                  )}
                </form.Subscribe>
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
