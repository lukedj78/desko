import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';

export const metadata = {
  title: 'Desko · Sai chi sarà in ufficio quando ci sarai tu',
  description:
    'Tool interno per dichiarare e consultare le presenze in ufficio. Privacy-first, volontario, niente controllo.',
};

const FEATURES: Array<{
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}> = [
  {
    icon: <CalendarMonthOutlinedIcon />,
    eyebrow: 'Pianifica',
    title: 'Dichiari in due tap.',
    body:
      'Imposta i giorni in cui sarai in ufficio dal mobile, anche con un pattern ricorrente. Stop al "vado e vediamo".',
  },
  {
    icon: <GroupsOutlinedIcon />,
    eyebrow: 'Coordina',
    title: 'Vedi chi ci sarà.',
    body:
      'Lista colleghi presenti raggruppata per piano, filtrabile per team o follower. Niente più viaggi vanificati.',
  },
  {
    icon: <LayersOutlinedIcon />,
    eyebrow: 'Sposta',
    title: 'Cambia piano live.',
    body:
      'Sei al 7° ma scendi al 2° per pranzo? Sposta il tuo piano in un tap, i colleghi che ti seguono lo vedono entro 30 secondi.',
  },
  {
    icon: <VisibilityOffOutlinedIcon />,
    eyebrow: 'Decidi',
    title: 'Tu controlli chi vede.',
    body:
      'Tutti, solo il tuo team, solo chi ti segue, oppure modalità incognito. Diritto all\'oblio sul passato esposto come pulsante.',
  },
];

const HOW_STEPS: Array<{ step: string; title: string; body: string }> = [
  {
    step: '01',
    title: 'Accedi col tuo account aziendale',
    body: 'Login Microsoft Entra ID o email/password. Niente nuovi account da gestire.',
  },
  {
    step: '02',
    title: 'Imposta il tuo pattern',
    body: 'Dichiari le giornate ricorrenti (es. martedì + giovedì) o vai per singolo giorno.',
  },
  {
    step: '03',
    title: 'Apri Desko prima del treno',
    body: 'Vedi se vale la pena venire. Se sì, sei pronto. Se no, lavori da casa.',
  },
];

function FeatureCard({
  icon,
  eyebrow,
  title,
  body,
}: (typeof FEATURES)[number]) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Stack spacing={1}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Typography variant="h4" sx={{ fontSize: 20 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {body}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function HowItWorksStep({
  step,
  title,
  body,
}: (typeof HOW_STEPS)[number]) {
  return (
    <Stack direction="row" spacing={3} alignItems="flex-start">
      <Typography
        sx={{
          fontFamily: 'var(--font-jetbrains)',
          fontSize: 36,
          fontWeight: 700,
          color: 'primary.dark',
          lineHeight: 1,
          flexShrink: 0,
          minWidth: 56,
        }}
      >
        {step}
      </Typography>
      <Stack spacing={0.75}>
        <Typography variant="h4" sx={{ fontSize: 20 }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {body}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function HomePage() {
  return (
    <Box component="main" sx={{ minHeight: '100dvh' }}>
      {/* TopBar minimale (no auth-shell) */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 'appBar',
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            py: 2,
            px: { xs: 2.5, sm: 3, md: 4 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              D
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Desko
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Link href="/showcase" style={{ textDecoration: 'none' }}>
              <Button variant="text" size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                Design system
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button variant="text" size="small">
                Accedi
              </Button>
            </Link>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <Button variant="contained" size="small">
                Inizia ora
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>

      {/* Hero */}
      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 8, md: 14 },
          pb: { xs: 8, md: 12 },
          px: { xs: 2.5, sm: 3, md: 4 },
        }}
      >
        <Stack spacing={4}>
          <Eyebrow>Desko · Sede Milano</Eyebrow>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 800,
              fontSize: { xs: 44, sm: 56, md: 80 },
              lineHeight: 0.95,
              letterSpacing: '-2px',
              maxWidth: { xs: '100%', md: '14ch' },
            }}
          >
            Sai chi sarà in ufficio quando ci sarai tu.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: '60ch', fontSize: { xs: 16, md: 18 } }}
          >
            Strumento informativo, volontario, privacy-first. Dichiari le tue presenze in due
            tap, vedi i colleghi del tuo team a colpo d&apos;occhio, ti sposti tra il 7° e il 2°
            piano live. <strong>Niente controllo, niente gamification.</strong>
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 2 }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                fullWidth
              >
                Inizia ora
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                size="large"
                color="inherit"
                startIcon={<MicrosoftIcon />}
                fullWidth
              >
                Continua con Microsoft
              </Button>
            </Link>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ pt: 2, flexWrap: 'wrap', gap: 2 }}>
            {[
              { value: '50–150', label: 'Dipendenti per azienda' },
              { value: '2 tap', label: 'Per dichiarare presenza' },
              { value: '0 tracking', label: 'Niente geofencing, niente badge' },
            ].map((stat) => (
              <Stack key={stat.label} spacing={0.25} sx={{ minWidth: 120 }}>
                <Typography
                  sx={{
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 800,
                    fontSize: 24,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {stat.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Container>

      {/* Features grid */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Container
          maxWidth="xl"
          sx={{ py: { xs: 8, md: 12 }, px: { xs: 2.5, sm: 3, md: 4 } }}
        >
          <Stack spacing={6}>
            <Stack spacing={1.5} sx={{ maxWidth: '60ch' }}>
              <Eyebrow>Cosa fa Desko</Eyebrow>
              <Typography
                component="h2"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 32, md: 48 },
                  lineHeight: 1.05,
                  letterSpacing: '-1px',
                }}
              >
                Quattro cose, fatte bene.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Pianifica, coordina, sposta, decidi chi vede. Niente di più.
              </Typography>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
              }}
            >
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* How it works */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
        <Container
          maxWidth="xl"
          sx={{ py: { xs: 8, md: 12 }, px: { xs: 2.5, sm: 3, md: 4 } }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 6, md: 10 },
              gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' },
              alignItems: 'flex-start',
            }}
          >
            <Stack spacing={1.5}>
              <Eyebrow>Come funziona</Eyebrow>
              <Typography
                component="h2"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 700,
                  fontSize: { xs: 32, md: 44 },
                  lineHeight: 1.05,
                  letterSpacing: '-0.8px',
                }}
              >
                Tre step, un minuto.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Setup volontario, niente onboarding obbligatorio. Inizi dal mobile mentre sei in
                metro.
              </Typography>
            </Stack>
            <Stack spacing={5} divider={<Divider />}>
              {HOW_STEPS.map((s) => (
                <HowItWorksStep key={s.step} {...s} />
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Privacy + tech band */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Container
          maxWidth="xl"
          sx={{ py: { xs: 8, md: 12 }, px: { xs: 2.5, sm: 3, md: 4 } }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            <Card sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LockOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="h4" sx={{ fontSize: 18 }}>
                  GDPR-first
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Minimizzazione, retention 90 giorni, diritto all&apos;oblio. Niente tracking
                  abitudini lavorative al di fuori del tuo consenso.
                </Typography>
              </Stack>
            </Card>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MicrosoftIcon fontSize="small" />
                </Box>
                <Typography variant="h4" sx={{ fontSize: 18 }}>
                  Microsoft Entra ID
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  SSO con il tuo account aziendale + MFA via Microsoft Authenticator. Nessuna
                  password locale da ricordare.
                </Typography>
              </Stack>
            </Card>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: 'info.main',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GroupsOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="h4" sx={{ fontSize: 18 }}>
                  Per HR, non per controllo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Vista aggregata anonimizzata con k-anonymity ≥5. Decisioni su spazi e giornate
                  tematiche senza monitorare le persone.
                </Typography>
              </Stack>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(135deg, rgba(232,185,49,0.18) 0%, rgba(232,185,49,0.05) 100%)',
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            py: { xs: 8, md: 12 },
            px: { xs: 2.5, sm: 3, md: 4 },
            textAlign: 'center',
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Eyebrow>Inizia adesso</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 800,
                fontSize: { xs: 32, md: 56 },
                lineHeight: 1.0,
                letterSpacing: '-1.4px',
              }}
            >
              Una giornata in ufficio merita un team.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '50ch' }}>
              Smetti di fare il viaggio alla cieca. Apri Desko, vedi il segnale, decidi.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Link href="/signup" style={{ textDecoration: 'none', width: '100%' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  fullWidth
                  sx={{
                    color: '#FFFFFF !important',
                    minWidth: { sm: 200 },
                  }}
                >
                  Crea il tuo account
                </Button>
              </Link>
              <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
                <Button
                  variant="outlined"
                  size="large"
                  color="inherit"
                  fullWidth
                  sx={{ minWidth: { sm: 200 } }}
                >
                  Accedi
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{ borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}
      >
        <Container
          maxWidth="xl"
          sx={{
            py: 4,
            px: { xs: 2.5, sm: 3, md: 4 },
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 0.75,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                D
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'var(--font-jetbrains)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: 11,
                }}
              >
                Desko · tool interno
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Link href="/showcase" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'var(--font-jetbrains)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: 11,
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  Design system
                </Typography>
              </Link>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'var(--font-jetbrains)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: 11,
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  Accedi
                </Typography>
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
