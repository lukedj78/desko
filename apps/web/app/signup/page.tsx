'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';
import { Field } from '@/components/site/field';
import { MicrosoftIcon } from '@/components/site/microsoft-icon';
import { PasswordField } from '@/components/site/password-field';
import {
  PasswordStrengthMeter,
  passwordStrength,
} from '@/components/site/password-strength-meter';
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
  const showMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
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
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        px: { xs: 2.5, sm: 3, md: 4 },
      }}
    >
      <Stack spacing={4}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            D
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Desko
          </Typography>
        </Stack>

        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Stack spacing={1} sx={{ textAlign: 'center' }}>
                <Eyebrow>Crea account</Eyebrow>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 700,
                    fontSize: { xs: 24, md: 28 },
                    lineHeight: 1.1,
                    letterSpacing: '-0.4px',
                  }}
                >
                  Inizia con Desko.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sai chi sarà in ufficio quando ci sarai tu — in due tap.
                </Typography>
              </Stack>

              {error ? (
                <Alert severity="error" variant="outlined">
                  {error}
                </Alert>
              ) : null}

              <Button
                onClick={handleMicrosoftSignup}
                disabled={microsoftPending || pending}
                variant="outlined"
                size="large"
                fullWidth
                color="inherit"
                startIcon={
                  microsoftPending ? <CircularProgress size={16} /> : <MicrosoftIcon />
                }
                sx={{ borderColor: 'divider', color: 'text.primary' }}
              >
                Continua con Microsoft
              </Button>

              <Divider>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  oppure
                </Typography>
              </Divider>

              <Box component="form" onSubmit={handleSignup}>
                <Stack spacing={2.5}>
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
                  <Stack spacing={1.5}>
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
                    {/* Strength meter visibile solo dopo che l'utente inizia a digitare */}
                    {password.length > 0 ? (
                      <PasswordStrengthMeter password={password} />
                    ) : null}
                  </Stack>
                  <PasswordField
                    id="signup-confirm-password"
                    name="confirmPassword"
                    label="Conferma password"
                    placeholder="Ripeti la password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={showMismatch}
                    helperText={
                      showMismatch
                        ? 'Le password non coincidono.'
                        : passwordsMatch
                        ? '✓ Le password coincidono.'
                        : undefined
                    }
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!canSubmit}
                    startIcon={pending ? <CircularProgress size={16} /> : null}
                  >
                    Crea account
                  </Button>
                </Stack>
              </Box>

              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                Hai già un account?{' '}
                <Typography
                  component={Link}
                  href="/login"
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Accedi
                </Typography>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontFamily: 'var(--font-jetbrains)',
            px: 2,
          }}
        >
          Registrandoti accetti le policy interne di trattamento dati per il tool aziendale.
        </Typography>
      </Stack>
    </Container>
  );
}
