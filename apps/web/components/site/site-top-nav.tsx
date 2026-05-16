import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Design system', href: '/showcase' },
];

export function SiteTopNav() {
  return (
    <AppBar position="sticky">
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{
            px: { xs: 3, sm: 4, md: 6, lg: 8 },
            minHeight: { xs: 56, md: 64 },
            gap: { xs: 2, md: 4 },
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              component="span"
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'var(--font-inter)',
              }}
              aria-hidden
            >
              D
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              Desko
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={3}
            sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, ml: 4 }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {link.label}
                </Typography>
              </Link>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="text"
              size="small"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Accedi
            </Button>
            <Button variant="contained" size="small">
              Dichiara presenza
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
