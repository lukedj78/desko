'use client';

import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { declarePresence, leaveOffice, updateFloor } from '@/lib/server/presence';
import type { Floor } from '@/lib/presence-domain';
import type { PresenceEntry } from '@/lib/queries/presence';

type Props = {
  entry: PresenceEntry;
  /** ISO date della vista giorno (può essere oggi o un altro giorno). */
  date: string;
};

const FLOOR_LABEL: Record<Floor, string> = {
  seventh_floor: '7° Piano · stanza',
  second_floor: '2° Piano · co-working',
};

const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Card del dipendente loggato nella vista giorno: hover state + click apre menu
 * con azioni sulla propria presenza (sposta piano, passa a remoto, annulla).
 *
 * Le actions cablano `lib/server/presence.ts` reale.
 */
export function MyPresenceItem({ entry, date }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const open = Boolean(anchorEl);
  const today = isoToday();
  const isToday = date === today;
  const otherFloor: Floor =
    entry.floor === 'seventh_floor' ? 'second_floor' : 'seventh_floor';

  const close = () => setAnchorEl(null);

  const run = (label: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    close();
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.message ?? 'Operazione fallita.');
        return;
      }
      setToast(label);
      router.refresh();
    });
  };

  const handleSwitchFloor = () =>
    run(`Spostato al ${otherFloor === 'seventh_floor' ? '7°' : '2°'} piano`, () =>
      updateFloor({ date, floor: otherFloor }),
    );

  const handleGoRemote = () =>
    run('Passato a remoto', () =>
      declarePresence({
        date,
        status: 'remote',
        floor: null,
      }),
    );

  const handleLeaveOffice = () =>
    run("Uscita dall'ufficio confermata", () => leaveOffice());

  const handleCancel = () =>
    run('Dichiarazione annullata', () =>
      declarePresence({ date, status: 'unspecified', floor: null }),
    );

  return (
    <>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: { xs: '100%', sm: 240, md: 260 },
          px: 1.5,
          py: 1.25,
          borderRadius: 1.5,
          backgroundColor: 'rgba(232, 185, 49, 0.10)',
          border: '1px solid',
          borderColor: 'primary.main',
          cursor: 'pointer',
          transition: 'background-color 120ms ease, border-color 120ms ease',
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(232, 185, 49, 0.18)',
            borderColor: 'primary.dark',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            border: '2px solid',
            borderColor: 'primary.main',
            flexShrink: 0,
          }}
        >
          {entry.initials}
        </Avatar>
        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {entry.displayName.replace(' (tu)', '')}
            </Typography>
            <Box
              component="span"
              sx={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'primary.contrastText',
                backgroundColor: 'primary.main',
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                flexShrink: 0,
                lineHeight: 1.2,
              }}
            >
              Tu
            </Box>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
            {entry.team ?? '—'}
          </Typography>
        </Stack>
        {pending ? (
          <CircularProgress size={16} />
        ) : (
          <KeyboardArrowDownIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
        )}
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: 10,
            }}
          >
            La tua presenza
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.floor ? FLOOR_LABEL[entry.floor] : 'In ufficio · piano da definire'}
          </Typography>
        </Box>

        {entry.floor !== null ? (
          <MenuItem onClick={handleSwitchFloor} disabled={pending}>
            <ListItemIcon>
              <LayersOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={`Sposta al ${otherFloor === 'seventh_floor' ? '7°' : '2°'} piano`}
              secondary={FLOOR_LABEL[otherFloor]}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ) : null}
        {entry.floor === null ? (
          <MenuItem
            onClick={() => run('Piano impostato a 7°', () =>
              updateFloor({ date, floor: 'seventh_floor' }),
            )}
            disabled={pending}
          >
            <ListItemIcon>
              <LayersOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sposta al 7° piano"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            />
          </MenuItem>
        ) : null}
        {entry.floor === null ? (
          <MenuItem
            onClick={() => run('Piano impostato a 2°', () =>
              updateFloor({ date, floor: 'second_floor' }),
            )}
            disabled={pending}
          >
            <ListItemIcon>
              <LayersOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sposta al 2° piano"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            />
          </MenuItem>
        ) : null}

        <MenuItem onClick={handleGoRemote} disabled={pending}>
          <ListItemIcon>
            <HomeWorkOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />
          </ListItemIcon>
          <ListItemText
            primary="Passa a lavoro da remoto"
            secondary="Cambi la dichiarazione del giorno"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>

        {isToday ? (
          <MenuItem onClick={handleLeaveOffice} disabled={pending}>
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
            </ListItemIcon>
            <ListItemText
              primary="Esci dall'ufficio"
              secondary="Aggiorna lo stato a remoto · solo oggi"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 600,
                color: 'warning.main',
              }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ) : null}

        <MenuItem onClick={handleCancel} disabled={pending}>
          <ListItemIcon>
            <RemoveCircleOutlineOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText
            primary="Annulla la dichiarazione"
            secondary="Rimuovi la presenza per questo giorno"
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: 600,
              color: 'error.main',
            }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
      </Menu>

      {error ? (
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)} variant="filled">
            {error}
          </Alert>
        </Snackbar>
      ) : null}

      {toast ? (
        <Snackbar
          open={!!toast}
          autoHideDuration={2500}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setToast(null)} variant="filled">
            {toast}
          </Alert>
        </Snackbar>
      ) : null}
    </>
  );
}
