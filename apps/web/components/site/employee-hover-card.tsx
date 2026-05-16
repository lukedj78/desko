'use client';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';

import { FloorBadge } from './floor-badge';
import type { PresenceEntry } from '@desko/queries/presence';

const TEAM_COLORS: Record<string, string> = {
  Engineering: '#3D87C9',
  Product: '#2D7A3F',
  Marketing: '#C73E44',
  Sales: '#9C5BCC',
  HR: '#D4A625',
};

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const updated = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(0, Math.round((now - updated) / 60000));
  if (diffMin < 1) return 'adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h fa`;
  return `${Math.round(diffH / 24)}g fa`;
}

/**
 * Scheda dipendente mostrata in popover dell'EmployeeHoverCard.
 * Layout: avatar + nome + team in alto, FloorBadge + last update sotto, 2 button azione.
 */
function EmployeeMiniCard({ entry }: { entry: PresenceEntry }) {
  const teamColor = entry.team ? TEAM_COLORS[entry.team] ?? '#868685' : '#868685';

  return (
    <Box sx={{ p: 2, minWidth: 260 }}>
      {/* Header: avatar + identity */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Avatar
          sx={{
            width: 52,
            height: 52,
            fontSize: 17,
            fontWeight: 700,
            bgcolor: 'background.default',
            color: 'text.primary',
          }}
        >
          {entry.initials}
        </Avatar>
        <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {entry.displayName}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {entry.team ? (
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: teamColor,
                  flexShrink: 0,
                }}
              />
            ) : null}
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {entry.team ?? '—'}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label="Email" sx={{ color: 'text.secondary' }}>
            <EmailOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Status info */}
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            Posizione
          </Typography>
          <FloorBadge floor={entry.floor} variant="outline" showFull />
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            Aggiornato
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'var(--font-jetbrains)', color: 'text.primary' }}
          >
            {relativeTime(entry.lastFloorUpdateAt)}
          </Typography>
        </Stack>
        {entry.isLastMinute ? (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              Modalità
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'warning.main', fontWeight: 700, fontSize: 11 }}
            >
              Last-minute
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {/* Actions */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          sx={{ fontSize: 12, py: 0.5 }}
        >
          Vedi profilo
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 14 }} />}
          sx={{ fontSize: 12, py: 0.5 }}
        >
          Segui
        </Button>
      </Stack>
    </Box>
  );
}

export function EmployeeHoverCard({
  entry,
  children,
  isMe,
}: {
  entry: PresenceEntry;
  children: ReactElement;
  isMe?: boolean;
}) {
  // Sull'utente loggato non mostriamo il popover (sa già le sue info)
  if (isMe) return children;

  return (
    <Tooltip
      title={<EmployeeMiniCard entry={entry} />}
      placement="top"
      arrow
      enterDelay={150}
      leaveDelay={100}
      enterTouchDelay={200}
      leaveTouchDelay={3000}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 12px 32px rgba(14,15,12,0.16), 0 0 0 1px rgba(14,15,12,0.06)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            padding: 0,
            fontSize: 14,
            maxWidth: 320,
          },
        },
        arrow: {
          sx: {
            color: 'background.paper',
            '&::before': {
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        },
      }}
    >
      {/*
       * Wrappiamo in <span> per evitare un hydration mismatch: MUI Tooltip,
       * quando il child è un MUI Avatar, inietta handler `onTouchStart` solo
       * lato client → il DOM differisce tra SSR e idratazione. Lo span fa da
       * cuscinetto neutro: gli handler vanno sullo span, non sull'Avatar.
       */}
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </Tooltip>
  );
}
