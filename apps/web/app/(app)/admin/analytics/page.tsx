import { redirect } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Eyebrow } from '@/components/site/eyebrow';
import { getSession } from '@/lib/auth-server';
import { getHrAnalyticsSummary } from '@/lib/queries/hr-analytics';

import { TodayKpis } from './_components/today-kpis';
import { WeekdayBars } from './_components/weekday-bars';
import { WeeklyTrend } from './_components/weekly-trend';

export const metadata = { title: 'HR analytics' };

// Sempre dinamico: la pagina dipende da today() e dalle entries più recenti.
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = new Set(['admin', 'hr_analytics']);

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!ALLOWED_ROLES.has(role)) {
    redirect('/dashboard');
  }

  const summary = await getHrAnalyticsSummary();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Eyebrow>Admin · HR analytics</Eyebrow>
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
            Presenza ufficio, in aggregato.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Solo numeri, mai nomi. Aggregati con cap minimo 3 persone per evitare
            che si possa risalire al singolo collega da combinazioni granulari.
          </Typography>
        </Stack>

        <Alert severity="info" variant="outlined" sx={{ borderStyle: 'dashed' }}>
          <strong>Privacy first.</strong> Questa pagina è visibile a chi ha ruolo{' '}
          <code>admin</code> o <code>hr_analytics</code>. Nessun dato esposto è
          per-utente: tutto è conteggio o media.
        </Alert>

        <TodayKpis today={summary.today} />

        <WeekdayBars
          weekday={summary.weekday}
          totalActiveUsers={summary.today.totalActiveUsers}
        />

        <WeeklyTrend weekly={summary.weekly} />
      </Stack>
    </Container>
  );
}
