'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
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
import { Suspense, useEffect, useState } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';
import { authClient } from '@/lib/auth-client';

type Status = 'pending' | 'no-token' | 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'no-token');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      const { error } = await authClient.verifyEmail({ query: { token } });
      if (cancelled) return;
      if (error) {
        setErrorMessage(
          error.message ??
            'Verifica fallita. Il link potrebbe essere scaduto o già usato.',
        );
        setStatus('error');
      } else {
        setStatus('success');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // No token: invita a controllare la propria casella (entry-point passivo)
  if (status === 'no-token') {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MarkEmailReadOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Stack spacing={1}>
              <Eyebrow>Verifica email</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 22, md: 26 },
                }}
              >
                Controlla la tua casella.
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ti abbiamo inviato un link di conferma. Clicca il pulsante nell&apos;email
                per attivare il tuo account. Il link scade tra 24 ore.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" component={Link} href="/login">
                Vai al login
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (status === 'verifying') {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                backgroundColor: 'background.default',
                color: 'text.primary',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <HourglassEmptyOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Stack spacing={1}>
              <Eyebrow>Verifica in corso</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 22, md: 26 },
                }}
              >
                Stiamo confermando la tua email…
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Solo un secondo.
              </Typography>
            </Stack>
            <CircularProgress size={28} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
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
              <Eyebrow>Email verificata</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 22, md: 26 },
                }}
              >
                Tutto pronto.
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Il tuo account è attivo. Ora puoi accedere e iniziare a dichiarare le tue
                presenze in ufficio.
              </Typography>
            </Stack>
            <Button variant="contained" size="large" component={Link} href="/dashboard">
              Vai alla dashboard
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // error
  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              backgroundColor: 'error.main',
              color: 'error.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 32 }} />
          </Box>
          <Stack spacing={1}>
            <Eyebrow>Verifica fallita</Eyebrow>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 700,
                fontSize: { xs: 22, md: 26 },
              }}
            >
              Link non valido.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {errorMessage}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" component={Link} href="/signup">
              Registrati di nuovo
            </Button>
            <Button variant="contained" component={Link} href="/login">
              Vai al login
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
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
          <VerifyEmailContent />
        </Suspense>
      </Stack>
    </Container>
  );
}
