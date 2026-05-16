import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import { EmployeeHoverCard } from '@/components/site/employee-hover-card';
import { Eyebrow } from '@/components/site/eyebrow';
import { getCurrentUser } from '@desko/auth/server';
import {
  getFloorOccupancy,
  getMyPresenceToday,
  getPresencesForDate,
  getTodayCounts,
} from '@desko/queries/presence';
import { FLOOR_META, type Floor } from '@desko/domain';

export const metadata = { title: 'Dashboard' };

const formatTodayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const TEAM_COLORS: Record<string, string> = {
  Engineering: '#3D87C9',
  Product: '#2D7A3F',
  Marketing: '#C73E44',
  Sales: '#9C5BCC',
  HR: '#D4A625',
};

/**
 * Card "Check-in confermato" centrale, layout Stitch-like:
 * - icon area sx (avatar 56px)
 * - label PRESENZA ORA + Piano corrente in evidenza
 * - 2 button a destra (Sposta al X / Esci)
 */
function CheckInHeroCard({
  floor,
  lastFloorUpdateAt,
}: {
  floor: Floor | null;
  lastFloorUpdateAt: string | null;
}) {
  const otherFloor: Floor = floor === 'seventh_floor' ? 'second_floor' : 'seventh_floor';

  return (
    <Card sx={{ p: { xs: 2.5, md: 3.5 }, height: '100%' }}>
      <Stack spacing={2.5} sx={{ height: '100%' }}>
        {/* Riga 1: icon + chip + check-in time */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: { xs: 44, md: 56 },
              height: { xs: 44, md: 56 },
              borderRadius: 1.5,
              backgroundColor: 'success.main',
              color: 'success.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 0 4px rgba(45, 122, 63, 0.12)',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: 'wrap', gap: 0.75, minWidth: 0, flexGrow: 1 }}
          >
            <Chip
              label="PRESENZA ORA"
              size="small"
              sx={{
                backgroundColor: 'success.main',
                color: 'success.contrastText',
                fontWeight: 700,
                fontSize: 10,
                height: 22,
                letterSpacing: '0.06em',
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
            >
              check-in {formatTime(lastFloorUpdateAt)}
            </Typography>
          </Stack>
        </Stack>

        {/* Riga 2: title + body — full width */}
        <Stack spacing={0.75}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 700,
              fontSize: { xs: 22, md: 28 },
              lineHeight: 1.1,
              letterSpacing: '-0.4px',
            }}
          >
            Check-in confermato
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {floor
              ? `Stai lavorando al ${FLOOR_META[floor].label} — ${FLOOR_META[floor].description.toLowerCase()}.`
              : 'Sei in ufficio. Indica il piano per coordinarti coi colleghi.'}
          </Typography>
        </Stack>

        {/* Riga 3: 2 button stack vertical su mobile, row su sm+ */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          sx={{ width: '100%', mt: 'auto', pt: 1 }}
        >
          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            size="large"
            fullWidth
            sx={{ flex: 1, whiteSpace: 'nowrap' }}
          >
            Sposta al {FLOOR_META[otherFloor].shortLabel}
          </Button>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            size="large"
            fullWidth
            color="inherit"
            sx={{ flex: 1, whiteSpace: 'nowrap' }}
          >
            Esci dall&apos;ufficio
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

/**
 * Card "Occupazione piano corrente" — donut grande + percentuale + capacità.
 * Mostra il piano dove l'utente è ora (default 7° se non ha indicato).
 */
function OccupancyHeroCard({
  floor,
  presentCount,
  capacity,
}: {
  floor: Floor;
  presentCount: number;
  capacity: number;
}) {
  const meta = FLOOR_META[floor];
  const pct = Math.round((presentCount / capacity) * 100);
  const tone = pct < 50 ? 'success.main' : pct < 80 ? 'primary.main' : 'error.main';
  const free = capacity - presentCount;

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 3 },
        height: '100%',
        background: 'linear-gradient(135deg, rgba(232,185,49,0.18) 0%, rgba(232,185,49,0.05) 100%)',
        borderColor: 'rgba(232,185,49,0.4)',
      }}
    >
      <Stack spacing={2.5} sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={0.25}>
            <Eyebrow>Occupazione piano</Eyebrow>
            <Typography variant="h4" sx={{ fontSize: 18 }}>
              {meta.label}
            </Typography>
          </Stack>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.dark',
              flexShrink: 0,
            }}
          >
            <LayersOutlinedIcon fontSize="small" />
          </Box>
        </Stack>

        {/* Donut con percentuale */}
        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              position: 'relative',
              width: 120,
              height: 120,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `conic-gradient(var(--desko-palette-primary-main) 0% ${pct}%, rgba(14,15,12,0.08) ${pct}% 100%)`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 12,
                borderRadius: '50%',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 800,
                  fontSize: 32,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: tone,
                }}
              >
                {pct}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                pieno
              </Typography>
            </Box>
          </Box>
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 800,
                  fontSize: 22,
                  lineHeight: 1,
                }}
              >
                {free}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                postazioni libere
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {presentCount} colleghi presenti su {capacity} disponibili
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: tone,
                fontWeight: 600,
                fontSize: 11,
                fontFamily: 'var(--font-jetbrains)',
              }}
            >
              {pct < 50 ? '↘ disponibile' : pct < 80 ? '→ si riempie' : '↗ quasi pieno'}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

/**
 * Card collega — orizzontale, layout Stitch-style:
 * avatar 56px + nome + team subtitle + chip status piano a destra.
 */
function ColleagueHorizontalCard({
  entry,
  isMe,
}: {
  entry: Awaited<ReturnType<typeof getPresencesForDate>>[number];
  isMe?: boolean;
}) {
  const teamColor = entry.team ? TEAM_COLORS[entry.team] ?? '#868685' : '#868685';
  const floorChip =
    entry.floor === 'seventh_floor'
      ? { label: 'AL 7°', bg: 'rgba(45,122,63,0.15)', color: '#1F5630' }
      : entry.floor === 'second_floor'
      ? { label: 'AL 2°', bg: 'rgba(232,185,49,0.2)', color: '#5A4500' }
      : { label: 'N/A', bg: 'background.default', color: 'text.secondary' };

  const avatar = (
    <Avatar
      sx={{
        width: 56,
        height: 56,
        fontSize: 18,
        fontWeight: 700,
        bgcolor: isMe ? 'primary.main' : 'background.default',
        color: isMe ? 'primary.contrastText' : 'text.primary',
        flexShrink: 0,
        cursor: isMe ? 'default' : 'pointer',
      }}
    >
      {entry.initials}
    </Avatar>
  );

  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
        <EmployeeHoverCard entry={entry} isMe={isMe}>{avatar}</EmployeeHoverCard>
        <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 15 }} noWrap>
            {isMe ? 'Tu' : entry.displayName}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {entry.team ?? '—'}
            </Typography>
          </Stack>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={floorChip.label}
              size="small"
              sx={{
                backgroundColor: floorChip.bg,
                color: floorChip.color,
                fontWeight: 700,
                fontSize: 10,
                height: 20,
                letterSpacing: '0.04em',
              }}
            />
            {entry.isLastMinute ? (
              <Chip
                label="LAST-MIN"
                size="small"
                sx={{
                  ml: 0.5,
                  backgroundColor: 'rgba(232,185,49,0.2)',
                  color: '#5A4500',
                  fontWeight: 700,
                  fontSize: 10,
                  height: 20,
                  letterSpacing: '0.04em',
                }}
              />
            ) : null}
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

export default async function DashboardPage() {
  const [currentUser, presences, occupancy, counts, mine] = await Promise.all([
    getCurrentUser(),
    getPresencesForDate(),
    getFloorOccupancy(),
    getTodayCounts(),
    getMyPresenceToday(),
  ]);
  const firstName = currentUser.name.trim().split(/\s+/)[0] ?? currentUser.name;

  const myUserId = 'mb';
  const inOffice = presences.filter((p) => p.status === 'in_office');

  // Mostro l'occupazione del piano dove sono io (default 7° se non ho dichiarato)
  const myFloor: Floor = mine.floor ?? 'seventh_floor';
  const myFloorData =
    occupancy.byFloor.find((f) => f.floor === myFloor) ?? occupancy.byFloor[0]!;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={4}>
        {/* Welcome */}
        <Stack spacing={1}>
          <Eyebrow>{formatTodayLabel()}</Eyebrow>
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
            Bentornato, {firstName}.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Ecco il riepilogo della tua giornata in ufficio.
          </Typography>
        </Stack>

        {/* Hero row: Check-in (2/3) + Occupancy KPI (1/3) */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            alignItems: 'stretch',
          }}
        >
          <CheckInHeroCard floor={mine.floor} lastFloorUpdateAt={mine.lastFloorUpdateAt} />
          <OccupancyHeroCard
            floor={myFloorData.floor}
            presentCount={myFloorData.presentCount}
            capacity={myFloorData.capacity}
          />
        </Box>

        {/* Colleghi in ufficio — header + horizontal grid */}
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ flexWrap: 'wrap', gap: 1.5 }}
          >
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="h3" sx={{ fontSize: { xs: 20, md: 22 } }}>
                Colleghi in ufficio
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
              >
                ({inOffice.length})
              </Typography>
            </Stack>
            <Link href="/calendar" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowOutwardIcon fontSize="small" />}
              >
                Vedi calendar settimanale
              </Button>
            </Link>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
            }}
          >
            {inOffice.slice(0, 8).map((entry) => (
              <ColleagueHorizontalCard
                key={entry.userId}
                entry={entry}
                isMe={entry.userId === myUserId}
              />
            ))}
          </Box>
        </Stack>

        {/* Hero CTA in fondo — ispirato a "Mappa del 7° Piano" Stitch ma allineato al non-desk-booking di Desko */}
        <Card
          sx={{
            p: 0,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            background:
              'linear-gradient(135deg, var(--desko-palette-primary-main) 0%, #F4C84A 60%, #E8B931 100%)',
            color: 'primary.contrastText',
            borderColor: 'transparent',
          }}
        >
          <Stack spacing={2.5} sx={{ p: { xs: 3, md: 4 } }}>
            <Eyebrow>Vista per piano</Eyebrow>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 800,
                fontSize: { xs: 26, md: 32 },
                lineHeight: 1.1,
                letterSpacing: '-0.6px',
                color: 'primary.contrastText',
              }}
            >
              Apri la vista piani per coordinarti col team.
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(43, 31, 0, 0.75)' }}>
              Vedi capacità in tempo reale del 7° Piano (stanza) e del 2° Piano (co-working).
              Sposta il tuo piano in un tap, aggiorna i colleghi che ti seguono.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Link
                href="/piani"
                style={{ textDecoration: 'none', flex: 1, width: '100%' }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  sx={{
                    color: '#FFFFFF !important',
                    '&:hover': { color: '#FFFFFF !important' },
                    '&.MuiButton-containedSecondary': { color: '#FFFFFF' },
                    minWidth: { sm: 200 },
                  }}
                >
                  Apri vista piani
                </Button>
              </Link>
              <Link
                href="/impostazioni"
                style={{ textDecoration: 'none', flex: 1, width: '100%' }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  sx={{
                    borderColor: 'secondary.main',
                    color: 'secondary.main',
                    minWidth: { sm: 200 },
                    '&:hover': {
                      borderColor: 'secondary.main',
                      backgroundColor: 'rgba(14,15,12,0.08)',
                    },
                  }}
                >
                  Imposta piano default
                </Button>
              </Link>
            </Stack>
          </Stack>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              backgroundColor: 'rgba(43, 31, 0, 0.08)',
            }}
          >
            <Box
              sx={{
                width: 140,
                height: 140,
                borderRadius: 3,
                backgroundColor: 'primary.contrastText',
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayersOutlinedIcon sx={{ fontSize: 64 }} />
            </Box>
          </Box>
        </Card>

        {/* KPI strip in fondo */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {[
            { label: 'In ufficio', value: counts.totalDeclared, color: 'success.main' },
            { label: 'Last-minute', value: counts.lastMinute, color: 'warning.main' },
            { label: 'In remoto', value: counts.remote, color: 'info.main' },
            { label: 'Da pattern', value: counts.inOfficeFromPattern, color: 'text.secondary' },
          ].map((kpi) => (
            <Card key={kpi.label} sx={{ p: 2 }}>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: 11,
                  }}
                >
                  {kpi.label}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 800,
                    fontSize: 28,
                    lineHeight: 1,
                    color: kpi.color,
                  }}
                >
                  {kpi.value}
                </Typography>
              </Stack>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}
