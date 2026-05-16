import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { EmployeeHoverCard } from './employee-hover-card';
import { FloorBadge } from './floor-badge';
import type { PresenceEntry } from '@desko/queries/presence';

const TEAM_COLORS: Record<string, string> = {
  Engineering: '#3D87C9',
  Product: '#2D7A3F',
  Marketing: '#C73E44',
  Sales: '#9C5BCC',
  HR: '#D4A625',
};

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const updated = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(0, Math.round((now - updated) / 60000));
  if (diffMin < 1) return 'adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.round(diffMin / 60);
  return `${diffH}h fa`;
}

/**
 * Card piccola con avatar + nome + team chip + piano badge.
 * Layout Stitch-inspired: avatar 40px, due righe testo, badge piano a destra.
 */
export function ColleagueCard({
  entry,
  isMe,
  showFloor = true,
  showLastUpdate = false,
  variant = 'card',
}: {
  entry: PresenceEntry;
  isMe?: boolean;
  showFloor?: boolean;
  showLastUpdate?: boolean;
  variant?: 'card' | 'row';
}) {
  const teamColor = entry.team ? TEAM_COLORS[entry.team] ?? '#868685' : '#868685';
  const ago = timeAgo(entry.lastFloorUpdateAt);

  const avatar = (
    <Avatar
      sx={{
        width: 40,
        height: 40,
        fontSize: 14,
        fontWeight: 600,
        bgcolor: isMe ? 'primary.main' : 'background.default',
        color: isMe ? 'primary.contrastText' : 'text.primary',
        cursor: isMe ? 'default' : 'pointer',
      }}
    >
      {entry.initials}
    </Avatar>
  );

  const inner = (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
      <EmployeeHoverCard entry={entry} isMe={isMe}>{avatar}</EmployeeHoverCard>
      <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {isMe ? 'Tu' : entry.displayName}
          </Typography>
          {entry.isLastMinute ? (
            <Typography
              variant="caption"
              sx={{ color: 'warning.main', fontWeight: 600, fontSize: 10 }}
            >
              · last-minute
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          {entry.team ? (
            <Box
              component="span"
              sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: teamColor, flexShrink: 0 }}
            />
          ) : null}
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
            {entry.team ?? '—'}
            {showLastUpdate && ago ? ` · agg. ${ago}` : ''}
          </Typography>
        </Stack>
      </Stack>
      {showFloor ? <FloorBadge floor={entry.floor} /> : null}
    </Stack>
  );

  if (variant === 'row') {
    return (
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>{inner}</Box>
    );
  }

  return (
    <Card sx={{ p: 2, height: '100%' }}>{inner}</Card>
  );
}
