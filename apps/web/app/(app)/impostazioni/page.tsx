'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WeekendOutlinedIcon from '@mui/icons-material/WeekendOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';
import { Field } from '@/components/site/field';
import { FLOOR_META, type Floor } from '@desko/domain';

type Day = 'M' | 'T' | 'W' | 'TH' | 'F';
const DAYS: Array<{ key: Day; label: string; short: string }> = [
  { key: 'M', label: 'Lun', short: 'M' },
  { key: 'T', label: 'Mar', short: 'T' },
  { key: 'W', label: 'Mer', short: 'W' },
  { key: 'TH', label: 'Gio', short: 'G' },
  { key: 'F', label: 'Ven', short: 'F' },
];

/**
 * Skyline Milano stylized — gradient warm ocra + silhouette di Duomo, Pirellone,
 * Velasca, Bosco Verticale e Galleria. Niente immagini remote, tutto SVG inline.
 * 100% deterministic per il build statico, 0 dipendenze di rete.
 */
function MilanoSkylineHero() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: { xs: 200, md: 260 },
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 800 280"
        preserveAspectRatio="xMidYMax slice"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBEFD0" />
            <stop offset="50%" stopColor="#F4C84A" />
            <stop offset="100%" stopColor="#E8B931" />
          </linearGradient>
          <linearGradient id="bgBuildings" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7A5A12" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5A4500" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fgBuildings" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D2A00" />
            <stop offset="100%" stopColor="#2B1F00" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="800" height="280" fill="url(#sky)" />

        {/* Sun */}
        <circle cx="640" cy="80" r="38" fill="#FFFFFF" opacity="0.45" />
        <circle cx="640" cy="80" r="22" fill="#FFFFFF" opacity="0.7" />

        {/* Background buildings (lontane) */}
        <g fill="url(#bgBuildings)">
          <rect x="0" y="180" width="60" height="100" />
          <rect x="60" y="160" width="50" height="120" />
          <rect x="110" y="170" width="70" height="110" />
          <rect x="180" y="150" width="55" height="130" />
          <rect x="235" y="165" width="45" height="115" />
          <rect x="280" y="175" width="60" height="105" />
          <rect x="340" y="155" width="50" height="125" />
          <rect x="390" y="170" width="70" height="110" />
          <rect x="460" y="160" width="55" height="120" />
          <rect x="515" y="175" width="60" height="105" />
          <rect x="575" y="165" width="50" height="115" />
          <rect x="625" y="180" width="55" height="100" />
          <rect x="680" y="170" width="60" height="110" />
          <rect x="740" y="175" width="60" height="105" />
        </g>

        {/* Foreground skyline iconico Milano */}
        <g fill="url(#fgBuildings)">
          {/* Duomo silhouette stylized */}
          <path d="M 60 280 L 60 220 L 70 220 L 70 200 L 80 200 L 80 180 L 90 180 L 90 160 L 95 145 L 100 160 L 100 180 L 110 180 L 110 200 L 120 200 L 120 220 L 130 220 L 130 280 Z" />

          {/* Galleria */}
          <rect x="150" y="200" width="80" height="80" />
          <path d="M 160 200 L 160 175 L 220 175 L 220 200 Z" />
          <circle cx="190" cy="180" r="12" fill="url(#sky)" opacity="0.4" />

          {/* Pirellone (grattacielo Pirelli) */}
          <rect x="270" y="120" width="40" height="160" />
          <rect x="278" y="125" width="3" height="150" fill="url(#sky)" opacity="0.3" />
          <rect x="290" y="125" width="3" height="150" fill="url(#sky)" opacity="0.3" />
          <rect x="302" y="125" width="3" height="150" fill="url(#sky)" opacity="0.3" />

          {/* Torre Velasca (forma a fungo iconica) */}
          <rect x="350" y="180" width="40" height="100" />
          <path d="M 340 180 L 400 180 L 400 165 L 340 165 Z" />
          <rect x="360" y="135" width="20" height="30" />

          {/* Generic mid-rise */}
          <rect x="420" y="195" width="35" height="85" />
          <rect x="455" y="180" width="30" height="100" />

          {/* Bosco Verticale (2 torri) */}
          <rect x="510" y="100" width="36" height="180" />
          <rect x="558" y="130" width="36" height="150" />
          {/* Vegetation dots */}
          {[
            [515, 130], [528, 145], [540, 160], [515, 175], [528, 190], [540, 205], [515, 220], [528, 235], [540, 250],
            [563, 145], [576, 160], [588, 175], [563, 190], [576, 205], [588, 220], [563, 235], [576, 250],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#2D7A3F" opacity="0.65" />
          ))}

          {/* UniCredit Tower iconica */}
          <rect x="620" y="80" width="32" height="200" />
          <path d="M 636 80 L 636 50 L 640 50 L 640 80 Z" />

          {/* Last cluster */}
          <rect x="680" y="190" width="40" height="90" />
          <rect x="720" y="200" width="35" height="80" />
          <rect x="755" y="185" width="40" height="95" />
        </g>
      </Box>

      {/* Tag overlay top-right */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(4px)',
          fontFamily: 'var(--font-jetbrains)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'text.primary',
        }}
      >
        HQ · Milano
      </Box>
    </Box>
  );
}

function BentoCard({
  title,
  icon,
  description,
  children,
  action,
  span,
  noPadding,
}: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  span?: { md?: number; lg?: number };
  noPadding?: boolean;
}) {
  return (
    <Card
      sx={{
        gridColumn: {
          md: `span ${span?.md ?? 1}`,
          lg: `span ${span?.lg ?? span?.md ?? 1}`,
        },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, md: 3 },
          pt: { xs: 2.5, md: 3 },
          pb: noPadding ? 0 : { xs: 0, md: 0 },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontSize: 17, lineHeight: 1.2 }}>
                {title}
              </Typography>
              {description ? (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {description}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
          {action}
        </Stack>
      </Box>
      {children ? (
        <CardContent
          sx={{
            p: noPadding ? '0 !important' : { xs: 2.5, md: 3 },
            pt: noPadding ? 0 : { xs: 2.5, md: 3 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}

function RecurringDayToggle({
  active,
  onToggle,
  label,
  short,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  short: string;
}) {
  return (
    <Stack alignItems="center" spacing={0.75}>
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={`${label} ${active ? 'attivo' : 'inattivo'}`}
        sx={{
          width: { xs: 44, md: 48 },
          height: { xs: 44, md: 48 },
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: active ? 'primary.main' : 'divider',
          backgroundColor: active ? 'primary.main' : 'background.paper',
          color: active ? 'primary.contrastText' : 'text.primary',
          fontFamily: 'var(--font-inter)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          transition: 'all 120ms ease',
          '&:hover': {
            borderColor: active ? 'primary.dark' : 'text.secondary',
            transform: 'scale(1.02)',
          },
          '&:active': { transform: 'scale(0.98)' },
        }}
      >
        {short}
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
        {label}
      </Typography>
    </Stack>
  );
}

export default function ImpostazioniPage() {
  const [activeDays, setActiveDays] = useState<Set<Day>>(new Set(['T', 'TH']));
  const [defaultFloor, setDefaultFloor] = useState<Floor | ''>('seventh_floor');
  const [visibility, setVisibility] = useState('company');
  const [notifications, setNotifications] = useState({
    teamInOffice: true,
    floorUpdates: false,
    weeklyReminder: true,
  });

  const toggleDay = (k: Day) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={5}>
        {/* Header */}
        <Stack spacing={1}>
          <Eyebrow>Profilo · Privacy · Notifiche</Eyebrow>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 700,
              fontSize: { xs: 28, md: 36 },
              lineHeight: 1.1,
              letterSpacing: '-0.4px',
            }}
          >
            Profilo e Impostazioni.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Gestisci le tue informazioni personali e le preferenze di ufficio.
          </Typography>
        </Stack>

        {/* Bento grid */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
            gridAutoRows: 'minmax(min-content, max-content)',
          }}
        >
          {/* ROW 1 — Informazioni personali (span 2) + Sicurezza (span 1) */}
          <BentoCard
            title="Informazioni personali"
            icon={<PersonOutlineIcon fontSize="small" />}
            description="Sincronizzate da Entra ID, alcune sono modificabili."
            span={{ md: 2 }}
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field
                id="settings-name"
                label="Nome completo"
                defaultValue="Marco Bianchi"
                hint="da Entra ID"
                disabled
              />
              <Field
                id="settings-email"
                label="Email aziendale"
                defaultValue="marco.bianchi@azienda.it"
                hint="readonly"
                disabled
              />
              <Field
                id="settings-team"
                label="Dipartimento"
                select
                defaultValue="Engineering"
              >
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Product">Product</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
              </Field>
              <Field
                id="settings-role"
                label="Ruolo"
                defaultValue="Senior Software Engineer"
                optional
              />
            </Box>
          </BentoCard>

          <BentoCard
            title="Sicurezza"
            icon={<LockOutlinedIcon fontSize="small" />}
            description="Sessioni e accesso."
            action={
              <Button variant="outlined" size="small">
                Esci da tutti
              </Button>
            }
          >
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </Box>
                <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                    Authenticator attivo
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    MFA via Entra ID
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'text.primary',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                    Ultimo accesso
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    08:42 da Milano · macOS
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </BentoCard>

          {/* ROW 2 — Giorni ricorrenti (span 1) + Sede HQ HERO (span 2) */}
          <BentoCard
            title="Giorni ricorrenti in ufficio"
            icon={<WeekendOutlinedIcon fontSize="small" />}
            description="Pattern settimanale automatico."
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {DAYS.map((d) => (
                  <RecurringDayToggle
                    key={d.key}
                    active={activeDays.has(d.key)}
                    onToggle={() => toggleDay(d.key)}
                    label={d.label}
                    short={d.short}
                  />
                ))}
              </Stack>
              <Field
                id="default-floor"
                label="Piano preferito"
                helperText="Pre-selezionato quando dichiari presenza."
                select
                value={defaultFloor}
                onChange={(e) => setDefaultFloor(e.target.value as Floor)}
              >
                <MenuItem value="seventh_floor">{FLOOR_META.seventh_floor.label} · stanza</MenuItem>
                <MenuItem value="second_floor">{FLOOR_META.second_floor.label} · co-working</MenuItem>
                <MenuItem value="">Nessuno (decido ogni volta)</MenuItem>
              </Field>
            </Stack>
          </BentoCard>

          {/* Sede HQ HERO con skyline Milano */}
          <Card
            sx={{
              gridColumn: { md: 'span 2' },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              p: 0,
            }}
          >
            <MilanoSkylineHero />
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Eyebrow>Sede di riferimento</Eyebrow>
                    <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 28 }, lineHeight: 1.1 }}>
                      Milano HQ
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Via Tortona, 30 — 20144 Milano · Lombardia, IT
                    </Typography>
                  </Stack>
                  <LocationOnOutlinedIcon sx={{ color: 'text.secondary' }} />
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      7° Piano
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                      stanza tradizionale
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      backgroundColor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      2° Piano
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      co-working + bar
                    </Typography>
                  </Box>
                </Stack>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  }}
                >
                  {[
                    { label: 'Posti totali', value: '70' },
                    { label: 'Sale meeting', value: '4' },
                    { label: 'Bar interno', value: '2°' },
                  ].map((kpi) => (
                    <Box
                      key={kpi.label}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
                        {kpi.label}
                      </Typography>
                      <Typography sx={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>
                        {kpi.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* ROW 3 — Visibilità (span 1) + Notifiche (span 2) */}
          <BentoCard
            title="Visibilità presenze"
            icon={<VisibilityOutlinedIcon fontSize="small" />}
            description="Chi vede i tuoi giorni in ufficio."
          >
            <Stack spacing={2}>
              <Field
                id="visibility"
                label="Chi può vedere"
                select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                helperText="Si applica anche allo storico."
              >
                <MenuItem value="company">Tutti i colleghi</MenuItem>
                <MenuItem value="team">Solo il mio team</MenuItem>
                <MenuItem value="followers">Solo chi mi segue</MenuItem>
                <MenuItem value="hidden">Modalità incognito</MenuItem>
              </Field>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: 'background.default',
                  border: '1px dashed',
                  borderColor: 'error.main',
                }}
              >
                <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                    Cancella storico
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Diritto all&apos;oblio (GDPR)
                  </Typography>
                </Stack>
                <Button variant="outlined" color="error" size="small">
                  Cancella
                </Button>
              </Stack>
            </Stack>
          </BentoCard>

          <BentoCard
            title="Notifiche"
            icon={<NotificationsActiveOutlinedIcon fontSize="small" />}
            description="Cosa ricevi via Teams o email."
            span={{ md: 2 }}
          >
            <Stack spacing={1.5}>
              {[
                {
                  key: 'teamInOffice' as const,
                  title: 'Quando il mio team è in ufficio',
                  desc: 'Avviso quando 3+ membri del team confermano la stessa giornata.',
                },
                {
                  key: 'floorUpdates' as const,
                  title: 'Cambi di piano dei colleghi seguiti',
                  desc: 'Avviso quando una persona che segui si sposta tra 7° e 2°.',
                },
                {
                  key: 'weeklyReminder' as const,
                  title: 'Reminder settimanale',
                  desc: 'Domenica sera ti invitiamo a confermare la settimana entrante.',
                },
              ].map((n) => (
                <Stack
                  key={n.key}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    backgroundColor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {n.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {n.desc}
                    </Typography>
                  </Stack>
                  <Switch
                    checked={notifications[n.key]}
                    onChange={() =>
                      setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </BentoCard>
        </Box>

        {/* Save bar */}
        <Card sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Modifiche non salvate
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Pattern, visibilità e notifiche richiedono salvataggio esplicito.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Button variant="text" size="medium">
                Annulla
              </Button>
              <Button variant="contained" size="medium">
                Salva tutte le modifiche
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
