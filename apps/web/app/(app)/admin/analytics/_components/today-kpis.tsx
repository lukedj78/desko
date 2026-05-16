import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { HrTodaySummary } from '@/lib/queries/hr-analytics';

type Props = { today: HrTodaySummary };

const Kpi = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <Card sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
    <Stack spacing={0.5}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'var(--font-inter)',
          fontWeight: 700,
          fontSize: { xs: 28, md: 32 },
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {hint}
        </Typography>
      ) : null}
    </Stack>
  </Card>
);

export function TodayKpis({ today }: Props) {
  const dateLabel = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(today.date));

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
          Oggi
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
        >
          {dateLabel}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        <Kpi
          label="In ufficio"
          value={`${today.inOfficeTotal}`}
          hint={`${today.inOfficePct}% degli attivi (${today.totalActiveUsers})`}
        />
        <Kpi
          label="7° piano · stanza"
          value={`${today.inOfficeBySeventh}`}
          hint="dichiarazioni oggi"
        />
        <Kpi
          label="2° piano · co-working"
          value={`${today.inOfficeBySecond}`}
          hint="dichiarazioni oggi"
        />
        <Kpi
          label="Da remoto"
          value={`${today.remoteTotal}`}
          hint={`${today.unspecifiedTotal} non dichiarati`}
        />
      </Box>
    </Stack>
  );
}
