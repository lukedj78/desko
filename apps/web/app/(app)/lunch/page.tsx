import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Eyebrow } from '@/components/site/eyebrow';
import { getCurrentUser } from '@desko/auth/server';
import { getLunchProposalsForDate, getRestaurants } from '@desko/queries/lunch';
import { searchUsers } from '@desko/queries/presence';

import { CreateProposalButton } from './_components/create-proposal-button';
import { LunchProposalsList } from './_components/lunch-proposals-list';
import { RestaurantsGrid } from './_components/restaurants-grid';

export const metadata = { title: 'Pausa pranzo' };
export const dynamic = 'force-dynamic';

const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isoTomorrow = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDayLabel = (iso: string) => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
};

export default async function LunchPage() {
  const today = isoToday();
  const tomorrow = isoTomorrow();

  const [me, restaurants, todayProposals, tomorrowProposals, allUsers] = await Promise.all([
    getCurrentUser(),
    getRestaurants(),
    getLunchProposalsForDate(today),
    getLunchProposalsForDate(tomorrow),
    searchUsers('', 200), // lista completa invitabili (esclude self e bannati)
  ]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={5}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Eyebrow>Pausa pranzo</Eyebrow>
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
              Pranziamo insieme.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Crea una proposta, scegli un ristorante in zona, invita i colleghi.
              Pubblica visibile a tutti, privata solo agli invitati.
            </Typography>
          </Stack>
          <CreateProposalButton restaurants={restaurants} invitableUsers={allUsers} />
        </Stack>

        {/* Oggi */}
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'baseline' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography
              component="h2"
              sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 22 }}
            >
              Oggi
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
            >
              {formatDayLabel(today)}
            </Typography>
          </Stack>
          <LunchProposalsList proposals={todayProposals} myUserId={me.id} emptyAction />
        </Stack>

        {/* Domani */}
        {tomorrowProposals.length > 0 ? (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'baseline' }}
              justifyContent="space-between"
              spacing={1}
            >
              <Typography
                component="h2"
                sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 22 }}
              >
                Domani
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
              >
                {formatDayLabel(tomorrow)}
              </Typography>
            </Stack>
            <LunchProposalsList proposals={tomorrowProposals} myUserId={me.id} />
          </Stack>
        ) : null}

        {/* Ristoranti */}
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <RestaurantOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
              <Typography
                component="h2"
                sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 22 }}
              >
                Ristoranti in zona
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {restaurants.length} luoghi · zona Gae Aulenti
            </Typography>
          </Stack>
          <RestaurantsGrid restaurants={restaurants} />
        </Stack>

        {/* Privacy footer */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Le proposte pubbliche sono visibili a tutti i colleghi attivi (anche
            chi è in remoto). Le proposte private sono visibili solo agli invitati.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
