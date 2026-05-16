import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { WeekdayStat } from '@/lib/queries/hr-analytics';

type Props = {
  weekday: WeekdayStat[];
  totalActiveUsers: number;
};

export function WeekdayBars({ weekday, totalActiveUsers }: Props) {
  // Asse Y: max della scala = max(inOfficeAvg) o totalActiveUsers (cap), per
  // tenere le barre proporzionali e non troppo schiacciate quando i numeri sono bassi.
  const maxValue = Math.max(
    1,
    ...weekday.map((d) => d.inOfficeAvg),
    Math.ceil(totalActiveUsers * 0.6),
  );

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
          Per giorno della settimana
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Media giornaliera · ultime 4 settimane
        </Typography>
      </Stack>

      <Card sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: { xs: 1.5, md: 2.5 },
            alignItems: 'end',
            minHeight: 220,
          }}
        >
          {weekday.map((d) => {
            const heightPct = (d.inOfficeAvg / maxValue) * 100;
            return (
              <Stack
                key={d.weekday}
                spacing={1}
                alignItems="center"
                sx={{ height: '100%', justifyContent: 'flex-end' }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, fontFamily: 'var(--font-jetbrains)' }}
                >
                  {d.suppressed ? '—' : d.inOfficeAvg}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    minHeight: 4,
                    height: `${Math.max(heightPct, 2)}%`,
                    background: d.suppressed
                      ? 'repeating-linear-gradient(45deg, rgba(14,15,12,0.08) 0 4px, transparent 4px 8px)'
                      : 'linear-gradient(180deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-dark) 100%)',
                    border: d.suppressed ? '1px dashed' : 'none',
                    borderColor: 'divider',
                    borderRadius: 1,
                    transition: 'height 200ms ease',
                  }}
                />
                <Stack alignItems="center" spacing={0}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    {d.weekdayLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    {d.suppressed ? 'soglia' : `${d.inOfficePct}%`}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </Box>
      </Card>
    </Stack>
  );
}
