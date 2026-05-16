import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="div"
      variant="overline"
      sx={{
        color: 'text.secondary',
        fontFamily: 'var(--font-jetbrains)',
        letterSpacing: '0.12em',
        display: 'block',
      }}
    >
      {children}
    </Typography>
  );
}
