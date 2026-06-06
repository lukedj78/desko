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
import {
  PasswordStrengthMeter,
  passwordStrength,
} from '@/components/shared/auth/password-strength-meter';
import { signIn, signUp } from '@/lib/auth-client';

export default function SignupPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [microsoftPending, setMicrosoftPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const strength = passwordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    strength.meetsMinimum &&
    passwordsMatch &&
    !pending &&
    !microsoftPending;

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
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
      const { error: err } = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message ?? 'Registrazione fallita. Riprova.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  };

  const handleMicrosoftSignup = async () => {
    setError(null);
    setMicrosoftPending(true);
    try {
      const result = await signIn.social({
        provider: 'microsoft',
        callbackURL: '/dashboard',
      });
      if (result.error) {
        setError(result.error.message ?? 'Microsoft non ancora configurato.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore Microsoft signup.');
    } finally {
      setMicrosoftPending(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-muted px-6 py-10 md:py-16">
      <div className="w-full max-w-[600px] flex flex-col gap-8">
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
                <Eyebrow>Crea account</Eyebrow>
                <h1 className="font-sans text-2xl md:text-3xl font-bold leading-tight tracking-[-0.4px]">
                  Inizia con Desko.
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sai chi sarà in ufficio quando ci sarai tu — in due tap.
                </p>
              </div>

              {error ? <Alert variant="destructive">{error}</Alert> : null}

              <Button
                onClick={handleMicrosoftSignup}
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

              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">oppure</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <Field
                  id="signup-name"
                  name="name"
                  label="Nome completo"
                  placeholder="Marco Bianchi"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Field
                  id="signup-email"
                  name="email"
                  label="Email aziendale"
                  type="email"
                  placeholder="tu@azienda.it"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex flex-col gap-3">
                  <PasswordField
                    id="signup-password"
                    name="password"
                    label="Password"
                    placeholder="Almeno 8 caratteri"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password.length > 0 ? (
                    <PasswordStrengthMeter password={password} />
                  ) : null}
                </div>
                <PasswordField
                  id="signup-confirm-password"
                  name="confirmPassword"
                  label="Conferma password"
                  placeholder="Ripeti la password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  errorText={showMismatch ? 'Le password non coincidono.' : undefined}
                  helperText={
                    passwordsMatch ? '✓ Le password coincidono.' : undefined
                  }
                />
                <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Crea account
                </Button>
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
