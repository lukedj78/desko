import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { WeeklyTrendPoint } from '@/lib/queries/hr-analytics';

type Props = { weekly: WeeklyTrendPoint[] };

const formatWeekRange = (weekStart: string): string => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 4); // Lun → Ven
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(d);
  return `${fmt(start)} – ${fmt(end)}`;
};

export function WeeklyTrend({ weekly }: Props) {
  if (weekly.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography
          component="h2"
          sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 22 }}
        >
          Trend settimanale
        </Typography>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nessun dato disponibile sulle ultime 8 settimane.
          </Typography>
        </Card>
      </Stack>
    );
  }

  const maxValue = Math.max(...weekly.map((w) => w.inOfficeTotal));

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'baseline' }}
        spacing={1}
      >
        <Typography
          component="h2"
          sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 22 }}
        >
          Trend settimanale
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Totale presenze in ufficio · ultime 8 settimane
        </Typography>
      </Stack>

      <Card sx={{ p: 0, overflow: 'hidden' }}>
        <Stack>
          {weekly.map((w, idx) => {
            const widthPct = maxValue > 0 ? (w.inOfficeTotal / maxValue) * 100 : 0;
            return (
              <Stack
                key={w.isoWeek}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 2 }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{
                  px: { xs: 2.5, md: 3 },
                  py: 2,
                  borderTop: idx === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ minWidth: { sm: 180 } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatWeekRange(w.weekStart)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
                  >
                    {w.isoWeek}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, position: 'relative' }}>
                  <Box
                    sx={{
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: 'action.hover',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${widthPct}%`,
                        background:
                          'linear-gradient(90deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-dark) 100%)',
                        transition: 'width 200ms ease',
                      }}
                    />
                  </Box>
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="baseline"
                  sx={{ minWidth: { sm: 200 }, justifyContent: { sm: 'flex-end' } }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--font-jetbrains)',
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {w.inOfficeTotal}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {w.uniqueUsers} {w.uniqueUsers === 1 ? 'persona' : 'persone'}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Card>
    </Stack>
  );
}
