import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined';
import EmojiFoodBeverageOutlinedIcon from '@mui/icons-material/EmojiFoodBeverageOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { ColleagueCard } from '@/components/site/colleague-card';
import { EmployeeHoverCard } from '@/components/site/employee-hover-card';
import { Eyebrow } from '@/components/site/eyebrow';
import { getFloorOccupancy, getMyPresenceToday, getPresencesForDate } from '@/lib/queries/presence';
import { FLOOR_META, type Floor } from '@/lib/presence-domain';

export const metadata = { title: 'Piani' };

const FLOOR_VISUALS: Record<
  Floor,
  { icon: ReactNode; tagline: string; bullets: string[] }
> = {
  seventh_floor: {
    icon: <ChairOutlinedIcon sx={{ fontSize: 32 }} />,
    tagline: 'Stanza tradizionale con scrivanie individuali, focus zone e sale meeting.',
    bullets: ['Scrivanie individuali', 'Focus zone silenziose', '2 sale meeting'],
  },
  second_floor: {
    icon: <EmojiFoodBeverageOutlinedIcon sx={{ fontSize: 32 }} />,
    tagline: 'Ambiente co-working aperto con bar interno, lounge e tavoli condivisi.',
    bullets: ['Co-working aperto', 'Bar interno + lounge', 'Tavoli condivisi'],
  },
};

function FloorCard({
  floor,
  presentCount,
  capacity,
  byTeam,
  recentPeople,
  isMine,
}: {
  floor: Floor;
  presentCount: number;
  capacity: number;
  byTeam: Array<{ team: string; count: number }>;
  recentPeople: Awaited<ReturnType<typeof getPresencesForDate>>;
  isMine: boolean;
}) {
  const meta = FLOOR_META[floor];
  const visuals = FLOOR_VISUALS[floor];
  const pct = Math.round((presentCount / capacity) * 100);
  const tone = pct < 50 ? 'success.main' : pct < 80 ? 'primary.main' : 'error.main';
  const status =
    pct < 50 ? { label: 'Disponibile', color: 'success' as const }
    : pct < 80 ? { label: 'Si riempie', color: 'warning' as const }
    : { label: 'Quasi pieno', color: 'error' as const };

  return (
    <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header banner — altezza fissa per allineare le card affiancate */}
      <Box
        sx={{
          backgroundColor: floor === 'seventh_floor' ? 'background.default' : 'primary.light',
          color: floor === 'seventh_floor' ? 'text.primary' : 'primary.contrastText',
          px: { xs: 2.5, md: 3 },
          py: { xs: 3, md: 3.5 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Riga icona + titolo (titolo libero di occupare tutta la larghezza) */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {visuals.icon}
          </Box>
          <Stack spacing={0.25} sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)', lineHeight: 1.2 }}
            >
              {floor === 'seventh_floor' ? 'STANZA TRADIZIONALE' : 'CO-WORKING + BAR'}
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontSize: 24, lineHeight: 1.1, whiteSpace: 'nowrap' }}
            >
              {meta.label}
            </Typography>
          </Stack>
        </Stack>

        {/* Chip in riga separata, mai concorrenti col titolo */}
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {isMine ? (
            <Chip
              icon={<CheckCircleOutlineIcon />}
              label="Sei qui"
              size="small"
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 600,
              }}
            />
          ) : null}
          <Chip
            label={status.label}
            size="small"
            sx={{
              backgroundColor:
                status.color === 'success' ? 'success.main' :
                status.color === 'warning' ? 'warning.main' : 'error.main',
              color: status.color === 'warning' ? 'primary.contrastText' : '#FFFFFF',
              fontWeight: 600,
            }}
          />
        </Stack>

        {/* Tagline pinned in basso al banner */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 'auto',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {visuals.tagline}
        </Typography>
      </Box>

      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={3}>
          {/* Occupazione */}
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  sx={{
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 800,
                    fontSize: { xs: 32, md: 40 },
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {presentCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  / {capacity} postazioni
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}>
                {pct}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 8,
                borderRadius: 999,
                backgroundColor: 'background.default',
                '& .MuiLinearProgress-bar': { backgroundColor: tone },
              }}
            />
          </Stack>

          {/* Servizi disponibili */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {visuals.bullets.map((b) => (
              <Chip
                key={b}
                label={b}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, height: 24 }}
              />
            ))}
          </Stack>

          {/* Team breakdown */}
          {byTeam.length > 0 ? (
            <Stack spacing={1.5}>
              <Eyebrow>Team presenti</Eyebrow>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {byTeam.map((t) => (
                  <Box
                    key={t.team}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1,
                      backgroundColor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {t.team}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}>
                      {t.count}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nessuno qui in questo momento.
            </Typography>
          )}

          {/* Avatar group */}
          {recentPeople.length > 0 ? (
            <Stack spacing={1.5}>
              <Eyebrow>Chi è qui ora</Eyebrow>
              <Stack direction="row" spacing={1} alignItems="center">
                <AvatarGroup max={6}>
                  {recentPeople.map((p) => (
                    <EmployeeHoverCard key={p.userId} entry={p} isMe={p.userId === 'mb'}>
                      <Avatar
                        sx={{
                          bgcolor: p.userId === 'mb' ? 'primary.main' : 'background.default',
                          color: p.userId === 'mb' ? 'primary.contrastText' : 'text.primary',
                          fontSize: 13,
                          cursor: p.userId === 'mb' ? 'default' : 'pointer',
                        }}
                      >
                        {p.initials}
                      </Avatar>
                    </EmployeeHoverCard>
                  ))}
                </AvatarGroup>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {recentPeople.length} {recentPeople.length === 1 ? 'collega' : 'colleghi'}
                </Typography>
              </Stack>
            </Stack>
          ) : null}

          {/* CTA */}
          <Button
            variant={isMine ? 'outlined' : 'contained'}
            startIcon={isMine ? <CheckCircleOutlineIcon /> : <SwapHorizIcon />}
            size="large"
            disabled={isMine}
            fullWidth
          >
            {isMine ? `Sei già al ${meta.label}` : `Sposta qui (${meta.label})`}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function PianiPage() {
  const [occupancy, presences, mine] = await Promise.all([
    getFloorOccupancy(),
    getPresencesForDate(),
    getMyPresenceToday(),
  ]);

  const myUserId = 'mb';
  const inOffice = presences.filter((p) => p.status === 'in_office');
  const seventh = inOffice.filter((p) => p.floor === 'seventh_floor');
  const second = inOffice.filter((p) => p.floor === 'second_floor');
  const unspecified = inOffice.filter((p) => p.floor === null);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={5}>
        {/* Header */}
        <Stack spacing={1.5}>
          <Eyebrow>Piani · Sede Milano</Eyebrow>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 700,
              fontSize: { xs: 28, md: 36 },
              lineHeight: 1.1,
              letterSpacing: '-0.4px',
            }}
          >
            Dove stai lavorando oggi?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '60ch' }}>
            La sede ha due aree: il <strong>7° Piano</strong> con stanza tradizionale e il{' '}
            <strong>2° Piano</strong> con co-working e bar. Indica dove sei e spostati durante la
            giornata se cambia il tuo piano. È un riferimento informale per coordinarsi —{' '}
            <em>non desk booking</em>.
          </Typography>
        </Stack>

        {/* Summary band */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <GroupsOutlinedIcon sx={{ color: 'text.secondary' }} />
            <Stack>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {occupancy.totalInOffice} colleghi in ufficio adesso
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {seventh.length} al 7° · {second.length} al 2° · {unspecified.length} non
                indicato
              </Typography>
            </Stack>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            icon={<VerticalSplitOutlinedIcon />}
            label={
              mine.floor
                ? `Sei al ${FLOOR_META[mine.floor].label}`
                : 'Piano non indicato'
            }
            sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText', fontWeight: 600 }}
          />
        </Stack>

        {/* Floor cards */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          }}
        >
          {occupancy.byFloor.map((f) => {
            const recentPeople = f.floor === 'seventh_floor' ? seventh : second;
            return (
              <FloorCard
                key={f.floor}
                floor={f.floor}
                presentCount={f.presentCount}
                capacity={f.capacity}
                byTeam={f.byTeam}
                recentPeople={recentPeople}
                isMine={mine.floor === f.floor}
              />
            );
          })}
        </Box>

        {/* Unspecified panel */}
        {unspecified.length > 0 ? (
          <Card sx={{ p: { xs: 2.5, md: 3 }, backgroundColor: 'background.default' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Eyebrow>In ufficio · piano non indicato</Eyebrow>
                <Chip label={unspecified.length} size="small" sx={{ height: 22, fontSize: 11 }} />
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Questi colleghi hanno dichiarato la presenza ma non hanno specificato il piano.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                }}
              >
                {unspecified.map((p) => (
                  <ColleagueCard
                    key={p.userId}
                    entry={p}
                    isMe={p.userId === myUserId}
                    showFloor={false}
                  />
                ))}
              </Box>
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
