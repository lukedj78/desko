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
        {/* Brand */}
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
                <Eyebrow>Accedi</Eyebrow>
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
                  Bentornato.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Accedi con il tuo account aziendale Microsoft o con email e password.
                </Typography>
              </Stack>

              {error ? (
                <Alert severity="error" variant="outlined">
                  {error}
                </Alert>
              ) : null}

              {/* Microsoft */}
              <Button
                onClick={handleMicrosoftLogin}
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

              {/* Email + password */}
              <Box component="form" onSubmit={handleEmailLogin}>
                <Stack spacing={2.5}>
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
                      <Typography
                        component={Link}
                        href="/forgot-password"
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 400,
                          textDecoration: 'underline',
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        Password dimenticata?
                      </Typography>
                    }
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={pending || microsoftPending}
                    startIcon={pending ? <CircularProgress size={16} /> : null}
                  >
                    Accedi
                  </Button>
                </Stack>
              </Box>

              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                Non hai ancora un account?{' '}
                <Typography
                  component={Link}
                  href="/signup"
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Registrati
                </Typography>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{ textAlign: 'center', color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
        >
          Tool interno · accesso riservato ai dipendenti
        </Typography>
      </Stack>
    </Container>
  );
}
