'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';
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
  const showMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    !!token &&
    strength.meetsMinimum &&
    passwordsMatch &&
    !pending;

  if (!token) {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: 'error.main',
                color: 'error.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 28 }} />
            </Box>
            <Stack spacing={1}>
              <Eyebrow>Link non valido</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 22, md: 26 },
                }}
              >
                Token mancante o scaduto.
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Il link di reset non contiene un token valido. Richiedi un nuovo link
                dalla pagina &ldquo;password dimenticata&rdquo;.
              </Typography>
            </Stack>
            <Button variant="contained" component={Link} href="/forgot-password">
              Richiedi nuovo link
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                backgroundColor: 'success.main',
                color: 'success.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 6px rgba(45, 122, 63, 0.12)',
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 32 }} />
            </Box>
            <Stack spacing={1}>
              <Eyebrow>Password aggiornata</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 22, md: 26 },
                }}
              >
                Tutto fatto.
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                La tua password è stata reimpostata. Puoi accedere ora con le nuove
                credenziali.
              </Typography>
            </Stack>
            <Button variant="contained" component={Link} href="/login" size="large">
              Vai al login
            </Button>
          </Stack>
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
        setError(
          err.message ?? 'Reset password fallito. Il link potrebbe essere scaduto.',
        );
        return;
      }
      setSuccess(true);
    });
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Eyebrow>Reset password</Eyebrow>
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
              Imposta nuova password.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Scegli una password forte. Non riusarla su altri servizi.
            </Typography>
          </Stack>

          {error ? (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Stack spacing={1.5}>
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
                {password.length > 0 ? (
                  <PasswordStrengthMeter password={password} />
                ) : null}
              </Stack>
              <PasswordField
                id="reset-confirm-password"
                name="confirmPassword"
                label="Conferma nuova password"
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
                Imposta nuova password
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense
          fallback={
            <Card>
              <CardContent sx={{ p: 6, textAlign: 'center' }}>
                <CircularProgress size={32} />
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </Stack>
    </Container>
  );
}
