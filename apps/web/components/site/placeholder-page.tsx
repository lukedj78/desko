import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { Eyebrow } from './eyebrow';

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  ctaLabel: string;
  comingTasks?: string[];
};

/**
 * Pagina segnaposto coerente per tutte le route della nav che non hanno ancora UI vera.
 * Pensata per essere SOSTITUITA quando il flusso reale è pronto — non è una pagina "vuota",
 * è una pagina "sotto-cantiere" che mostra cosa ci sarà.
 */
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon,
  ctaLabel,
  comingTasks,
}: PlaceholderPageProps) {
  return (
    <Container
      maxWidth="md"
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 3, sm: 4, md: 6 },
      }}
    >
      <Stack spacing={5}>
        <Stack spacing={2} sx={{ maxWidth: '60ch' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 700,
              fontSize: { xs: 32, md: 44 },
              lineHeight: 1.05,
              letterSpacing: '-0.4px',
            }}
          >
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        </Stack>

        <Card sx={{ maxWidth: 720 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {icon}
                </Box>
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="h4">In costruzione</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Questa pagina è una placeholder. La UI definitiva arriverà nei prossimi sprint.
                  </Typography>
                </Stack>
              </Stack>

              {comingTasks && comingTasks.length > 0 ? (
                <Stack spacing={1.5}>
                  <Eyebrow>Cosa arriverà qui</Eyebrow>
                  <Stack component="ul" spacing={1} sx={{ pl: 2.5, m: 0 }}>
                    {comingTasks.map((task, i) => (
                      <Typography key={i} component="li" variant="body2" sx={{ color: 'text.primary' }}>
                        {task}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              ) : null}

              <Box>
                <Button variant="contained" disabled>
                  {ctaLabel}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
