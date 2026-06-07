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
import {
  PasswordStrengthMeter,
  passwordStrength,
} from '@/components/shared/auth/password-strength-meter';
import { signIn, signUp } from '@/lib/auth-client';
import { useCreateForm } from '@/lib/forms';

const SignupSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome richiesto'),
    email: z.string().trim().email('Email non valida'),
    password: z.string().min(8, 'Almeno 8 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((d) => passwordStrength(d.password).meetsMinimum, {
    message: 'La password non rispetta i requisiti minimi',
    path: ['password'],
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

type SignupInput = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [microsoftPending, setMicrosoftPending] = useState(false);
  const [microsoftError, setMicrosoftError] = useState<string | null>(null);

  const { form, formError } = useCreateForm<SignupInput, void>({
    schema: SignupSchema,
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    submit: async ({ name, email, password }) => {
      const { error } = await signUp.email({ name, email, password });
      if (error) throw new Error(error.message ?? 'Registrazione fallita. Riprova.');
    },
    onSuccess: () => {
      router.push('/dashboard');
      router.refresh();
    },
  });

  const handleMicrosoftSignup = async () => {
    setMicrosoftError(null);
    setMicrosoftPending(true);
    try {
      const result = await signIn.social({
        provider: 'microsoft',
        callbackURL: '/dashboard',
      });
      if (result.error) {
        setMicrosoftError(result.error.message ?? 'Microsoft non ancora configurato.');
      }
    } catch (e) {
      setMicrosoftError(e instanceof Error ? e.message : 'Errore Microsoft signup.');
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
                <Eyebrow>Crea account</Eyebrow>
                <h1 className="font-sans text-2xl md:text-3xl font-bold leading-tight tracking-[-0.4px]">
                  Inizia con Desko.
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sai chi sarà in ufficio quando ci sarai tu — in due tap.
                </p>
              </div>

              {displayError ? <Alert variant="destructive">{displayError}</Alert> : null}

              <Button
                onClick={handleMicrosoftSignup}
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

              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">oppure</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void form.handleSubmit();
                }}
                className="flex flex-col gap-4"
              >
                <form.Field name="name">
                  {(field) => (
                    <Field
                      id="signup-name"
                      label="Nome completo"
                      placeholder="Marco Bianchi"
                      autoComplete="name"
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

                <form.Field name="email">
                  {(field) => (
                    <Field
                      id="signup-email"
                      label="Email aziendale"
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
                    <div className="flex flex-col gap-3">
                      <PasswordField
                        id="signup-password"
                        label="Password"
                        placeholder="Almeno 8 caratteri"
                        autoComplete="new-password"
                        required
                        value={String(field.state.value ?? '')}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={
                          field.state.meta.isTouched && field.state.meta.errors.length > 0
                        }
                      />
                      {field.state.value ? (
                        <PasswordStrengthMeter password={String(field.state.value)} />
                      ) : null}
                    </div>
                  )}
                </form.Field>

                <form.Field name="confirmPassword">
                  {(field) => {
                    const password = String(form.state.values.password ?? '');
                    const confirm = String(field.state.value ?? '');
                    const showMismatch = confirm.length > 0 && password !== confirm;
                    const passwordsMatch = confirm.length > 0 && password === confirm;
                    return (
                      <PasswordField
                        id="signup-confirm-password"
                        label="Conferma password"
                        placeholder="Ripeti la password"
                        autoComplete="new-password"
                        required
                        value={confirm}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={showMismatch}
                        errorText={showMismatch ? 'Le password non coincidono.' : undefined}
                        helperText={passwordsMatch ? '✓ Le password coincidono.' : undefined}
                      />
                    );
                  }}
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
                      Crea account
                    </Button>
                  )}
                </form.Subscribe>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Hai già un account?{' '}
                <Link href="/login" className="font-semibold text-foreground underline">
                  Accedi
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="px-4 text-center font-mono text-xs tracking-[0.02em] text-muted-foreground">
          Registrandoti accetti le policy interne di trattamento dati per il tool aziendale.
        </p>
      </div>
    </main>
  );
}
