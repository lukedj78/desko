'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

/**
 * Root error boundary — cattura qualsiasi errore non gestito durante il render lato server o client.
 * Senza questo file, un errore non gestito blanca l'app sulla pagina di default Next che leak `error.message`.
 *
 * Mostra messaggio neutro all'utente; espone solo `error.digest` (id che il backend logga)
 * così che lui o lei possa fare riferimento all'incidente in supporto.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Desko] Uncaught error:', error);
  }, [error]);

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: { xs: 8, md: 12 },
        px: { xs: 3, sm: 4, md: 6 },
      }}
    >
      <Stack spacing={3}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Errore inaspettato
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: 32, md: 40 } }}>
          Qualcosa è andato storto.
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Hai trovato un errore che non avevamo previsto. Puoi riprovare oppure tornare alla home.
          Se l&apos;errore si ripete, segnalalo all&apos;IT con il riferimento qui sotto.
        </Typography>
        {error.digest ? (
          <Box
            component="code"
            sx={{
              fontFamily: 'var(--font-jetbrains)',
              fontSize: 12,
              backgroundColor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              px: 1.5,
              py: 1,
              alignSelf: 'flex-start',
              color: 'text.secondary',
            }}
          >
            digest: {error.digest}
          </Box>
        ) : null}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={reset}>
            Riprova
          </Button>
          <Button variant="text" href="/">
            Torna alla home
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
