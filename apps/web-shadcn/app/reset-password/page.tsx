'use client';

import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { z } from 'zod';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { DeskoBrand } from '@/components/shared/brand/desko-brand';
import { PasswordField } from '@/components/shared/auth/password-field';
import {
  PasswordStrengthMeter,
  passwordStrength,
} from '@/components/shared/auth/password-strength-meter';
import { authClient } from '@/lib/auth-client';
import { useCreateForm } from '@/lib/forms';

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Almeno 8 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  })
  .refine((data) => passwordStrength(data.password).meetsMinimum, {
    message: 'La password non rispetta i requisiti minimi',
    path: ['password'],
  });

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);

  const { form, formError } = useCreateForm<ResetPasswordInput, void>({
    schema: ResetPasswordSchema,
    defaultValues: { password: '', confirmPassword: '' },
    submit: async ({ password }) => {
      if (!token) throw new Error('Token mancante.');
      const { error } = await authClient.resetPassword({ token, newPassword: password });
      if (error) {
        throw new Error(error.message ?? 'Reset password fallito. Il link potrebbe essere scaduto.');
      }
      setSuccess(true);
    },
  });

  if (!token) {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex size-14 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
              <ShieldAlert className="size-7" />
            </div>
            <div className="flex flex-col gap-2">
              <Eyebrow>Link non valido</Eyebrow>
              <h1 className="font-sans text-xl md:text-2xl font-bold">
                Token mancante o scaduto.
              </h1>
              <p className="text-sm text-muted-foreground">
                Il link di reset non contiene un token valido. Richiedi un nuovo link dalla
                pagina &ldquo;password dimenticata&rdquo;.
              </p>
            </div>
            <Link href="/forgot-password" className="no-underline">
              <Button>Richiedi nuovo link</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
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
              <Eyebrow>Password aggiornata</Eyebrow>
              <h1 className="font-sans text-xl md:text-2xl font-bold">Tutto fatto.</h1>
              <p className="text-sm text-muted-foreground">
                La tua password è stata reimpostata. Puoi accedere ora con le nuove
                credenziali.
              </p>
            </div>
            <Link href="/login" className="no-underline">
              <Button size="lg">Vai al login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <Eyebrow>Reset password</Eyebrow>
            <h1 className="font-sans text-2xl md:text-3xl font-bold leading-tight tracking-[-0.4px]">
              Imposta nuova password.
            </h1>
            <p className="text-sm text-muted-foreground">
              Scegli una password forte. Non riusarla su altri servizi.
            </p>
          </div>

          {formError ? <Alert variant="destructive">{formError.message}</Alert> : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="password">
              {(field) => (
                <div className="flex flex-col gap-3">
                  <PasswordField
                    id="reset-password"
                    label="Nuova password"
                    placeholder="Almeno 8 caratteri"
                    autoComplete="new-password"
                    autoFocus
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
                // Confronta con la password corrente (cross-field via form.state)
                const password = String(form.state.values.password ?? '');
                const confirm = String(field.state.value ?? '');
                const showMismatch = confirm.length > 0 && password !== confirm;
                const passwordsMatch = confirm.length > 0 && password === confirm;
                return (
                  <PasswordField
                    id="reset-confirm-password"
                    label="Conferma nuova password"
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
                <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Imposta nuova password
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-[600px] flex flex-col gap-8">
        <div className="flex items-center justify-center">
          <DeskoBrand size="lg" wordmark />
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
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
