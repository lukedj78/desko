import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { Eyebrow } from './eyebrow';

type ShowcaseSectionProps = {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  noBorder?: boolean;
};

export function ShowcaseSection({
  eyebrow,
  title,
  intro,
  children,
  noBorder,
}: ShowcaseSectionProps) {
  return (
    <Box
      component="section"
      sx={{
        borderBottom: noBorder ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 8, md: 12 },
          px: { xs: 3, sm: 4, md: 6, lg: 8 },
        }}
      >
        <Stack spacing={5}>
          <Stack spacing={1.5} sx={{ maxWidth: '64ch' }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 700,
                fontSize: { xs: 32, md: 48 },
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </Typography>
            {intro ? (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {intro}
              </Typography>
            ) : null}
          </Stack>
          <Box>{children}</Box>
        </Stack>
      </Container>
    </Box>
  );
}
