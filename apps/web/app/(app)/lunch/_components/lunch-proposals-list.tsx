'use client';

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  cancelLunchProposal,
  joinLunchProposal,
  leaveLunchProposal,
} from '@desko/server-actions/lunch';
import type { ProposalSummary } from '@desko/queries/lunch';

type Props = {
  proposals: ProposalSummary[];
  myUserId: string;
  /** Se true, mostra anche un CTA "crea la prima proposta" nello stato vuoto. */
  emptyAction?: boolean;
};

const PRICE_TONE: Record<string, string> = {
  '€': '#3D87C9',
  '€€': '#D4A625',
  '€€€': '#9C5BCC',
};

export function LunchProposalsList({ proposals, myUserId, emptyAction }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (proposalId: string) => {
    setError(null);
    setPendingId(proposalId);
    startTransition(async () => {
      const res = await joinLunchProposal({ proposalId });
      setPendingId(null);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  };

  const handleLeave = (proposalId: string) => {
    setError(null);
    setPendingId(proposalId);
    startTransition(async () => {
      const res = await leaveLunchProposal({ proposalId });
      setPendingId(null);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  };

  const handleCancel = (proposalId: string) => {
    if (!confirm('Cancellare la proposta? Tutti i partecipanti saranno informati.'))
      return;
    setError(null);
    setPendingId(proposalId);
    startTransition(async () => {
      const res = await cancelLunchProposal({ proposalId });
      setPendingId(null);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  };

  if (proposals.length === 0) {
    return (
      <Card
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'background.default',
          borderStyle: 'dashed',
        }}
        variant="outlined"
      >
        <Stack spacing={1.5} alignItems="center">
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Nessuna proposta {emptyAction ? 'per oggi' : ''}.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
            {emptyAction
              ? 'Crea tu la prima proposta — scegli un ristorante e dai appuntamento ai colleghi.'
              : 'Nessuno ha ancora organizzato un pranzo.'}
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {error ? (
        <Alert severity="error" variant="outlined" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
        }}
      >
        {proposals.map((p) => {
          const isFull =
            p.maxParticipants !== null && p.participants.length >= p.maxParticipants;
          const showJoin = !p.iAmParticipant && !isFull;
          const showLeave = p.iAmParticipant && !p.iAmCreator;
          const showCancel = p.iAmCreator;
          const rowPending = pendingId === p.id && isPending;

          return (
            <Card key={p.id} sx={{ p: 0, overflow: 'hidden' }}>
              {/* Header con ristorante */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{
                  px: { xs: 2, md: 2.5 },
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.default',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {p.restaurant.emoji ?? '🍽️'}
                </Box>
                <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="baseline"
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                      {p.restaurant.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: PRICE_TONE[p.restaurant.priceRange] ?? 'text.secondary',
                      }}
                    >
                      {p.restaurant.priceRange}
                    </Typography>
                    {p.restaurant.ratingCount > 0 ? (
                      <Stack direction="row" spacing={0.25} alignItems="center">
                        <StarRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        >
                          {p.restaurant.ratingAvg.toFixed(1)}
                        </Typography>
                      </Stack>
                    ) : null}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                    {p.restaurant.address}
                    {p.restaurant.distanceM ? ` · ~${p.restaurant.distanceM}m` : ''}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  icon={
                    p.visibility === 'private' ? (
                      <LockOutlinedIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <PublicOutlinedIcon sx={{ fontSize: 14 }} />
                    )
                  }
                  label={p.visibility === 'private' ? 'Privata' : 'Pubblica'}
                  sx={{
                    backgroundColor:
                      p.visibility === 'private'
                        ? 'rgba(199, 62, 68, 0.10)'
                        : 'rgba(45, 122, 63, 0.12)',
                    color: p.visibility === 'private' ? '#8B2229' : '#1F5630',
                    fontWeight: 600,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                />
              </Stack>

              {/* Body */}
              <Stack spacing={1.5} sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {p.meetingTime}
                    </Typography>
                  </Stack>
                  <Box sx={{ width: 1, height: 14, backgroundColor: 'divider' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    organizza <strong>{p.createdBy.displayName}</strong>
                  </Typography>
                </Stack>

                {p.note ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      px: 1.5,
                      py: 1,
                      fontStyle: 'italic',
                    }}
                  >
                    “{p.note}”
                  </Typography>
                ) : null}

                {/* Partecipanti */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <AvatarGroup
                    spacing={10}
                    sx={{
                      '& .MuiAvatar-root': {
                        width: 28,
                        height: 28,
                        fontSize: 11,
                        fontWeight: 700,
                        border: '2px solid',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    {p.participants.slice(0, 5).map((u) => (
                      <Avatar
                        key={u.userId}
                        sx={{
                          bgcolor:
                            u.userId === myUserId ? 'primary.main' : 'background.default',
                          color:
                            u.userId === myUserId
                              ? 'primary.contrastText'
                              : 'text.primary',
                        }}
                      >
                        {u.initials}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
                  >
                    {p.participants.length}
                    {p.maxParticipants ? ` / ${p.maxParticipants}` : ''}{' '}
                    {p.participants.length === 1 ? 'iscritto' : 'iscritti'}
                  </Typography>
                </Stack>

                {/* Actions */}
                <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                  {showJoin ? (
                    <Button
                      variant="contained"
                      size="medium"
                      disabled={rowPending}
                      onClick={() => handleJoin(p.id)}
                      startIcon={
                        rowPending ? <CircularProgress size={14} color="inherit" /> : null
                      }
                    >
                      Unisciti
                    </Button>
                  ) : null}
                  {showLeave ? (
                    <Button
                      variant="outlined"
                      size="medium"
                      disabled={rowPending}
                      onClick={() => handleLeave(p.id)}
                    >
                      Esci
                    </Button>
                  ) : null}
                  {showCancel ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="medium"
                      disabled={rowPending}
                      onClick={() => handleCancel(p.id)}
                    >
                      Cancella proposta
                    </Button>
                  ) : null}
                  {isFull && !p.iAmParticipant ? (
                    <Chip label="Posti esauriti" size="small" color="error" />
                  ) : null}
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
}
