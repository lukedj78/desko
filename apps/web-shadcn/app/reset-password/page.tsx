'use client';

import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card, CardContent } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { PasswordField } from '@/components/site/password-field';
import {
  PasswordStrengthMeter,
  passwordStrength,
} from '@/components/site/password-strength-meter';
import { authClient } from '@/lib/auth-client';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const strength = passwordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = !!token && strength.meetsMinimum && passwordsMatch && !pending;

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!strength.meetsMinimum) {
      setError('La password non rispetta i requisiti minimi.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    startTransition(async () => {
      const { error: err } = await authClient.resetPassword({
        token,
        newPassword: password,
      });
      if (err) {
        setError(err.message ?? 'Reset password fallito. Il link potrebbe essere scaduto.');
        return;
      }
      setSuccess(true);
    });
  };

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

          {error ? <Alert variant="destructive">{error}</Alert> : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <PasswordField
                id="reset-password"
                name="password"
                label="Nuova password"
                placeholder="Almeno 8 caratteri"
                autoComplete="new-password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 ? <PasswordStrengthMeter password={password} /> : null}
            </div>
            <PasswordField
              id="reset-confirm-password"
              name="confirmPassword"
              label="Conferma nuova password"
              placeholder="Ripeti la password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              errorText={showMismatch ? 'Le password non coincidono.' : undefined}
              helperText={passwordsMatch ? '✓ Le password coincidono.' : undefined}
            />
            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Imposta nuova password
            </Button>
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
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
