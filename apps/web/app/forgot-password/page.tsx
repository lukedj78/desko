'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
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
import { useState, useTransition } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';
import { Field } from '@/components/site/field';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '').trim();

    if (!email) {
      setError('Inserisci la tua email aziendale.');
      return;
    }

    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      });
      if (result.error) {
        // Per privacy non riveliamo se l'email esiste o no — mostriamo
        // sempre lo stesso messaggio di successo.
        // Tracciamo solo errori "veri" (rate limit, network).
        if (result.error.status === 429) {
          setError('Hai già richiesto un reset di recente. Aspetta qualche minuto.');
          return;
        }
      }
      setSubmittedEmail(email);
    });
  };

  if (submittedEmail) {
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
                <MarkEmailReadOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Stack spacing={1}>
                <Eyebrow>Email inviata</Eyebrow>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 700,
                    fontSize: { xs: 22, md: 26 },
                    lineHeight: 1.1,
                  }}
                >
                  Controlla la tua casella.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Se l&apos;email <strong>{submittedEmail}</strong> è registrata, riceverai
                  un link per reimpostare la password. Il link scade tra 1 ora.
                </Typography>
              </Stack>
              <Button
                variant="text"
                component={Link}
                href="/login"
                startIcon={<ArrowBackIcon fontSize="small" />}
              >
                Torna al login
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

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
                  Hai dimenticato la password?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Inserisci la tua email. Ti invieremo un link per impostare una nuova
                  password.
                </Typography>
              </Stack>

              {error ? (
                <Alert severity="error" variant="outlined">
                  {error}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <Field
                    id="forgot-email"
                    name="email"
                    label="Email aziendale"
                    type="email"
                    placeholder="tu@azienda.it"
                    autoComplete="email"
                    required
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={pending}
                    startIcon={pending ? <CircularProgress size={16} /> : null}
                  >
                    Invia link di reset
                  </Button>
                </Stack>
              </Box>

              <Stack alignItems="center">
                <Button
                  variant="text"
                  component={Link}
                  href="/login"
                  startIcon={<ArrowBackIcon fontSize="small" />}
                  size="small"
                >
                  Torna al login
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
