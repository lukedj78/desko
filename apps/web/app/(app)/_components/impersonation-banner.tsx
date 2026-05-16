'use client';

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { admin } from '@/lib/auth-client';

type Props = {
  /** Utente che l'admin sta impersonando (i.e. session.user). */
  impersonatedUser: {
    name: string;
    email: string;
  };
};

/**
 * Banner sticky in cima a ogni pagina (app) quando la sessione corrente è
 * un'impersonate session (i.e. session.session.impersonatedBy != null).
 *
 * Cliccando "Esci dall'impersonate" chiamiamo `admin.stopImpersonating()` —
 * better-auth ripristina la sessione admin originale; refreshiamo per
 * far rivalutare le RSC.
 */
export function ImpersonationBanner({ impersonatedUser }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStop = async () => {
    setPending(true);
    setError(null);
    const { error: err } = await admin.stopImpersonating();
    if (err) {
      setError(err.message ?? 'Impossibile uscire dall’impersonate.');
      setPending(false);
      return;
    }
    router.push('/admin/users');
    router.refresh();
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        backgroundColor: 'warning.main',
        color: 'warning.contrastText',
        borderBottom: '2px solid',
        borderColor: 'warning.dark',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 2 }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ px: { xs: 2.5, md: 4 }, py: 1.25 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <VisibilityOutlinedIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Modalità impersonate
          </Typography>
          <Typography
            variant="body2"
            sx={{
              opacity: 0.85,
              fontFamily: 'var(--font-jetbrains)',
              minWidth: 0,
            }}
            noWrap
          >
            {impersonatedUser.name} · {impersonatedUser.email}
          </Typography>
        </Stack>

        {error ? (
          <Typography
            variant="caption"
            sx={{ flex: 1, fontWeight: 600, opacity: 0.9 }}
          >
            {error}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        <Button
          variant="contained"
          size="small"
          color="inherit"
          disabled={pending}
          onClick={() => void handleStop()}
          startIcon={
            pending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <LogoutOutlinedIcon fontSize="small" />
            )
          }
          sx={{
            backgroundColor: 'common.white',
            color: 'warning.dark',
            fontWeight: 700,
            '&:hover': { backgroundColor: 'grey.100' },
          }}
        >
          Torna admin
        </Button>
      </Stack>
    </Box>
  );
}
