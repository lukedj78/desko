'use client';

import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { Field } from '@desko/ui/components/field';
import { DeskoBrand } from '@/components/shared/brand/desko-brand';
import { authClient } from '@/lib/auth-client';
import { useCreateForm } from '@/lib/forms';

const ForgotPasswordSchema = z.object({
  email: z.string().email('Inserisci una email valida'),
});

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const { form, formError } = useCreateForm<ForgotPasswordInput, void>({
    schema: ForgotPasswordSchema,
    defaultValues: { email: '' },
    submit: async ({ email }) => {
      const trimmed = email.trim();
      const result = await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo: '/reset-password',
      });
      if (result.error) {
        if (result.error.status === 429) {
          throw new Error('Hai già richiesto un reset di recente. Aspetta qualche minuto.');
        }
        throw new Error(result.error.message ?? 'Errore richiesta reset.');
      }
      setSubmittedEmail(trimmed);
    },
  });

  if (submittedEmail) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
        <div className="w-full max-w-[600px]">
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
      <div className="w-full max-w-[600px] flex flex-col gap-8">
        <div className="flex items-center justify-center">
          <DeskoBrand size="lg" wordmark />
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

              {formError ? <Alert variant="destructive">{formError.message}</Alert> : null}

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
                      id="forgot-email"
                      label="Email aziendale"
                      type="email"
                      placeholder="tu@azienda.it"
                      autoComplete="email"
                      autoFocus
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
                      disabled={!canSubmit}
                    >
                      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                      Invia link di reset
                    </Button>
                  )}
                </form.Subscribe>
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
