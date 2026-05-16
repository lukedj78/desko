import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { type Floor, FLOOR_META } from '@desko/domain';

/**
 * Chip che mostra il piano di lavoro (US-7). Due valori: 7° / 2°.
 * Su `null` mostra "Piano non indicato" tenue.
 */
export function FloorBadge({
  floor,
  variant = 'soft',
  showFull,
}: {
  floor: Floor | null;
  variant?: 'soft' | 'outline' | 'solid';
  showFull?: boolean;
}) {
  if (floor === null) {
    return (
      <Chip
        label="Piano non indicato"
        size="small"
        variant="outlined"
        sx={{ borderStyle: 'dashed', fontWeight: 500, height: 22, fontSize: 11 }}
      />
    );
  }

  const meta = FLOOR_META[floor];
  const label = showFull ? meta.label : meta.shortLabel;

  if (variant === 'outline') {
    return (
      <Chip
        label={label}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600, height: 22, fontSize: 11 }}
      />
    );
  }

  if (variant === 'solid') {
    return (
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          fontWeight: 600,
          height: 22,
          fontSize: 11,
        }}
      />
    );
  }

  // soft (default)
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'primary.light',
        color: 'primary.contrastText',
        borderRadius: 999,
        px: 1,
        py: 0.25,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        opacity: 0.85,
      }}
    >
      {label}
    </Box>
  );
}
