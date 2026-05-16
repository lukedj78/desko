import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Link from 'next/link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  brand,
  surface,
  ink,
  semantic,
  border,
  radii,
  spacing as spacingTokens,
  type SpacingToken,
} from '@desko/design-tokens';

import { Eyebrow } from '@/components/site/eyebrow';
import { Field } from '@/components/site/field';
import { ShowcaseSection } from '@/components/site/showcase-section';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteTopNav } from '@/components/site/site-top-nav';

export const metadata = {
  title: 'Design system',
  description: 'Tokens, componenti e regole di tono di Desko.',
};

type Swatch = {
  name: string;
  hex: string;
  textColor: string;
  note: string;
};

const BRAND_SWATCHES: Swatch[] = [
  {
    name: 'brand.primary',
    hex: brand.primary,
    textColor: brand.primaryText,
    note: 'Ocra Gold — CTA primarie e indicatori "tu/oggi".',
  },
  {
    name: 'brand.primaryHover',
    hex: brand.primaryHover,
    textColor: brand.primaryText,
    note: 'Hover dei CTA — schiaritura controllata.',
  },
  {
    name: 'brand.primaryActive',
    hex: brand.primaryActive,
    textColor: brand.primaryText,
    note: 'Pressed state — più scura del base.',
  },
  {
    name: 'brand.primarySubtle',
    hex: brand.primarySubtle,
    textColor: brand.primaryText,
    note: 'Background tenue per badge "tu" e banner.',
  },
];

const SURFACE_SWATCHES: Swatch[] = [
  {
    name: 'surface.canvas',
    hex: surface.canvas,
    textColor: ink.primary,
    note: 'Off-white caldo — sfondo dell\'app, non bianco puro.',
  },
  {
    name: 'surface.paper',
    hex: surface.paper,
    textColor: ink.primary,
    note: 'Bianco puro — superficie card e dialog.',
  },
  {
    name: 'surface.paperAlt',
    hex: surface.paperAlt,
    textColor: ink.primary,
    note: 'Tinted alt — sidebar, header, hover di tertiary button.',
  },
  {
    name: 'surface.inverse',
    hex: surface.inverse,
    textColor: ink.onInverse,
    note: 'Near-black per sezioni inverted, toast, tooltip.',
  },
];

const SEMANTIC_SWATCHES: Swatch[] = [
  {
    name: 'semantic.success',
    hex: semantic.success,
    textColor: '#FFFFFF',
    note: 'Verde foresta — "in ufficio confermato", esiti positivi.',
  },
  {
    name: 'semantic.danger',
    hex: semantic.danger,
    textColor: '#FFFFFF',
    note: 'Rosso — errori, azioni distruttive (rare in Desko).',
  },
  {
    name: 'semantic.warning',
    hex: semantic.warning,
    textColor: brand.primaryText,
    note: 'Coincide con primary (tool informativo, no warning hard).',
  },
  {
    name: 'semantic.info',
    hex: semantic.info,
    textColor: '#FFFFFF',
    note: 'Blu — annotazioni informative, link.',
  },
];

const INK_SWATCHES: Swatch[] = [
  {
    name: 'ink.primary',
    hex: ink.primary,
    textColor: surface.paper,
    note: 'Testo primario — near-black, mai puro.',
  },
  {
    name: 'ink.secondary',
    hex: ink.secondary,
    textColor: surface.paper,
    note: 'Testo secondario — body muted, label.',
  },
  {
    name: 'ink.muted',
    hex: ink.muted,
    textColor: surface.paper,
    note: 'Testo tertiary — placeholder, helper.',
  },
];

type TypographyRow = {
  token: string;
  spec: string;
  sample: string;
  style: React.CSSProperties;
};

const TYPOGRAPHY_ROWS: TypographyRow[] = [
  {
    token: 'displayHero',
    spec: 'Inter · 56 / 0.95 · 800 · -1.4',
    sample: 'Chi è in ufficio mercoledì?',
    style: { fontWeight: 800, fontSize: 56, lineHeight: 0.95, letterSpacing: '-1.4px' },
  },
  {
    token: 'display',
    spec: 'Inter · 40 / 1.0 · 800 · -0.8',
    sample: 'La tua settimana',
    style: { fontWeight: 800, fontSize: 40, lineHeight: 1.0, letterSpacing: '-0.8px' },
  },
  {
    token: 'h1',
    spec: 'Inter · 32 / 1.1 · 700 · -0.4',
    sample: '24 colleghi in ufficio oggi',
    style: { fontWeight: 700, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.4px' },
  },
  {
    token: 'h2',
    spec: 'Inter · 24 / 1.2 · 700 · -0.24',
    sample: 'Segui il tuo team',
    style: { fontWeight: 700, fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.24px' },
  },
  {
    token: 'h3',
    spec: 'Inter · 20 / 1.25 · 600 · -0.2',
    sample: 'Marco Bianchi · Engineering',
    style: { fontWeight: 600, fontSize: 20, lineHeight: 1.25, letterSpacing: '-0.2px' },
  },
  {
    token: 'h4',
    spec: 'Inter · 18 / 1.3 · 600 · -0.1',
    sample: 'Mercoledì 13 maggio',
    style: { fontWeight: 600, fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.1px' },
  },
  {
    token: 'bodyLg',
    spec: 'Inter · 16 / 1.5 · 400',
    sample: 'Hai dichiarato 3 giorni questa settimana. Modifica fino alla mezzanotte di domenica.',
    style: { fontWeight: 400, fontSize: 16, lineHeight: 1.5 },
  },
  {
    token: 'body',
    spec: 'Inter · 14 / 1.5 · 400',
    sample: 'Sergio, Anna e Luca confermano la presenza martedì in sede Milano.',
    style: { fontWeight: 400, fontSize: 14, lineHeight: 1.5 },
  },
  {
    token: 'bodyStrong',
    spec: 'Inter · 14 / 1.5 · 600',
    sample: '12 in ufficio · 4 last-minute',
    style: { fontWeight: 600, fontSize: 14, lineHeight: 1.5 },
  },
  {
    token: 'caption',
    spec: 'Inter · 12 / 1.4 · 500 · 0.1',
    sample: 'Aggiornato 2 minuti fa',
    style: { fontWeight: 500, fontSize: 12, lineHeight: 1.4, letterSpacing: '0.1px' },
  },
  {
    token: 'overline',
    spec: 'Inter · 11 / 1.4 · 600 · 0.8 · UPPER',
    sample: 'QUESTA SETTIMANA',
    style: {
      fontWeight: 600,
      fontSize: 11,
      lineHeight: 1.4,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
    },
  },
  {
    token: 'button',
    spec: 'Inter · 14 / 1.0 · 600 · no upper',
    sample: 'Dichiara presenza',
    style: { fontWeight: 600, fontSize: 14, lineHeight: 1.0 },
  },
];

const RADII_TOKENS = [
  { name: 'xs', value: radii.xs, use: 'tag inline' },
  { name: 'sm', value: radii.sm, use: 'button, input' },
  { name: 'md', value: radii.md, use: 'list item' },
  { name: 'lg', value: radii.lg, use: 'card standard' },
  { name: 'xl', value: radii.xl, use: 'dialog, hero card' },
  { name: 'pill', value: 32, use: 'chip persona, badge' },
] as const;

const SPACING_KEYS: SpacingToken[] = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

const DO_RULES = [
  <>Usa l&apos;<strong>ocra solo per CTA</strong>, focus, e indicatori &ldquo;tu/oggi&rdquo;. Protegge il segnale visivo.</>,
  <>Mantieni il <strong>canvas warm (#FAFAF7)</strong>, non bianco puro. Atmosfera ufficio luminoso.</>,
  <>Numeri <strong>tabular-nums</strong> su calendari e tabelle. Evita il saltellamento delle cifre.</>,
  <>Scale <strong>1.02 / 0.98</strong> sui button, transizioni 200ms. Sobrio ma presente.</>,
  <>Radius <strong>8px sui button</strong>, 16px sulle card, pill solo per chip persona.</>,
];

const DONT_RULES = [
  <>Niente <strong>Wise Sans 900</strong> + line-height 0.85: troppo aggressivo per un tool interno.</>,
  <>Niente <strong>background ocra a tutto schermo</strong>: affatica, svaluta il CTA.</>,
  <>Niente <strong>button rotondi a pill (9999)</strong>: il radius 8px è il marker visivo di Desko.</>,
  <>Niente <strong>UPPERCASE</strong> sui button (default MUI da disabilitare globalmente).</>,
  <>Niente <strong>shadow generose</strong> stile Material classico: piatte + ring sottile.</>,
];

function SwatchCard({ swatch }: { swatch: Swatch }) {
  return (
    <Box
      sx={{
        backgroundColor: swatch.hex,
        color: swatch.textColor,
        borderRadius: `${radii.md}px`,
        border: `1px solid ${border.subtle}`,
        p: 2,
        height: 128,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'var(--font-jetbrains)',
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        {swatch.hex}
      </Typography>
      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {swatch.name}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 11, opacity: 0.85, lineHeight: 1.3 }}>
          {swatch.note}
        </Typography>
      </Stack>
    </Box>
  );
}

function ColorGroup({ label, swatches }: { label: string; swatches: Swatch[] }) {
  return (
    <Stack spacing={2}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        {swatches.map((s) => (
          <SwatchCard key={s.name} swatch={s} />
        ))}
      </Box>
    </Stack>
  );
}

export default function ShowcasePage() {
  return (
    <>
      <SiteTopNav />
      <Box component="main" sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* 1 — Header */}
        <Box component="section" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Container
            maxWidth="lg"
            sx={{
              py: { xs: 10, md: 16 },
              px: { xs: 3, sm: 4, md: 6, lg: 8 },
            }}
          >
            <Stack spacing={3} sx={{ maxWidth: '20ch' }}>
              <Eyebrow>Desko · design system</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 800,
                  fontSize: { xs: 44, md: 72 },
                  lineHeight: 0.95,
                  letterSpacing: '-1.6px',
                }}
              >
                Il sistema visivo di Desko.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '60ch' }}>
                Tokens, componenti e regole di tono. Generato da{' '}
                <Box component="code" sx={{ fontFamily: 'var(--font-jetbrains)', fontSize: 14, px: 0.75, py: 0.25, backgroundColor: surface.paperAlt, borderRadius: 0.75 }}>
                  .workflow/DESIGN.md
                </Box>{' '}
                via{' '}
                <Box component="code" sx={{ fontFamily: 'var(--font-jetbrains)', fontSize: 14, px: 0.75, py: 0.25, backgroundColor: surface.paperAlt, borderRadius: 0.75 }}>
                  design-md-to-app
                </Box>
                .
              </Typography>
              <Box>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <Button variant="text" size="small">
                    ← Torna alla home
                  </Button>
                </Link>
              </Box>
            </Stack>
          </Container>
        </Box>

        {/* 2 — Colors */}
        <ShowcaseSection
          eyebrow="01 · Colori"
          title="La palette."
          intro="Ocra Gold come unico accent, mai background di superfici grandi. Canvas warm — non bianco puro. Verde success scuro per non collidere con il giallo. Warning coincide con primary: in un tool informativo i warning sono rari."
        >
          <Stack spacing={5}>
            <ColorGroup label="Brand" swatches={BRAND_SWATCHES} />
            <ColorGroup label="Surface" swatches={SURFACE_SWATCHES} />
            <ColorGroup label="Semantic" swatches={SEMANTIC_SWATCHES} />
            <ColorGroup label="Ink" swatches={INK_SWATCHES} />
          </Stack>
        </ShowcaseSection>

        {/* 3 — Typography */}
        <ShowcaseSection
          eyebrow="02 · Tipografia"
          title="Una sola voce."
          intro="Inter al posto di Wise Sans, peso 800 al posto di 900, line-height 0.95 al posto di 0.85. Confident senza essere &ldquo;billboard&rdquo;. Mai uppercase sui button."
        >
          <Stack divider={<Divider />} sx={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
            {TYPOGRAPHY_ROWS.map((row) => (
              <Box
                key={row.token}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '160px 240px 1fr' },
                  gap: { xs: 1.5, md: 4 },
                  py: 3,
                  alignItems: 'baseline',
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'var(--font-jetbrains)', color: 'text.primary' }}>
                  {row.token}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'var(--font-jetbrains)',
                    fontSize: 12,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {row.spec}
                </Typography>
                <Box sx={{ ...row.style, color: 'text.primary' }}>{row.sample}</Box>
              </Box>
            ))}
          </Stack>
        </ShowcaseSection>

        {/* 4 — Buttons */}
        <ShowcaseSection
          eyebrow="03 · Button"
          title="Niente pill, niente urla."
          intro="Radius 8px (non 9999), no uppercase, scale 1.02 in hover. Le tre varianti coprono il 95% dei casi: contained per CTA primarie, outlined per secondarie, text per tertiary."
        >
          <Stack spacing={4}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Button variant="contained" size="large">
                Dichiara presenza
              </Button>
              <Button variant="outlined" size="large">
                Chi c&apos;è oggi
              </Button>
              <Button variant="text" size="large">
                Settimana successiva
              </Button>
              <Button variant="contained" color="error" size="large">
                Disattiva account
              </Button>
              <Button variant="contained" size="large" disabled>
                Salvato
              </Button>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Button variant="contained">Conferma settimana</Button>
              <Button variant="outlined">Modifica preferenze</Button>
              <Button variant="text">Annulla</Button>
              <Button variant="contained" size="small">
                Aggiungi giorno
              </Button>
              <Button variant="outlined" size="small">
                Filtra
              </Button>
            </Stack>
          </Stack>
        </ShowcaseSection>

        {/* 5 — Cards */}
        <ShowcaseSection
          eyebrow="04 · Card"
          title="Superfici stratificate."
          intro="Tre livelli di superficie: paper (default), paperAlt (callout), inverse (notifiche / sezioni dark). Mai shadow generose: ring sottile + shadow piatta."
        >
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Mercoledì 13 maggio</Typography>
                    <Chip label="Oggi" color="primary" size="small" />
                  </Stack>
                  <AvatarGroup max={5} sx={{ justifyContent: 'flex-start' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 14 }}>MB</Avatar>
                    <Avatar sx={{ bgcolor: surface.paperAlt, color: 'text.primary', fontSize: 14 }}>AG</Avatar>
                    <Avatar sx={{ bgcolor: surface.paperAlt, color: 'text.primary', fontSize: 14 }}>SL</Avatar>
                    <Avatar sx={{ bgcolor: surface.paperAlt, color: 'text.primary', fontSize: 14 }}>FR</Avatar>
                    <Avatar sx={{ bgcolor: surface.paperAlt, color: 'text.primary', fontSize: 14 }}>EM</Avatar>
                    <Avatar sx={{ bgcolor: surface.paperAlt, color: 'text.primary', fontSize: 14 }}>+7</Avatar>
                  </AvatarGroup>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    12 colleghi in sede Milano, di cui 3 dal tuo team.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: brand.primarySubtle, borderColor: brand.primary }}>
              <CardContent>
                <Stack spacing={2}>
                  <Eyebrow>Suggerito per te</Eyebrow>
                  <Typography variant="h4">Vieni mercoledì col team product.</Typography>
                  <Typography variant="body2" sx={{ color: ink.secondary }}>
                    Marco, Anna e Sergio hanno dichiarato la presenza. È la finestra migliore di
                    questa settimana per vedersi.
                  </Typography>
                  <Box>
                    <Button variant="contained" size="small">
                      Aggiungi al mio piano
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: surface.inverse, color: ink.onInverse, borderColor: 'transparent' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Eyebrow>Notifica sistema</Eyebrow>
                  <Typography variant="h4" sx={{ color: ink.onInverse }}>
                    Pattern settimanale aggiornato.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(250, 250, 247, 0.7)' }}>
                    Mar / Gio &middot; in ufficio. Effettivo dalla prossima settimana, modificabile
                    sempre.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </ShowcaseSection>

        {/* 6 — Inputs */}
        <ShowcaseSection
          eyebrow="05 · Form"
          title="Form chiari, errori gentili."
          intro="Outline default, focus ring ocra a 3px, errori inline con copy istruttiva. Mai validazioni urlate."
        >
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              maxWidth: 720,
            }}
          >
            <Field
              id="f-name"
              label="Nome e cognome"
              defaultValue="Marco Bianchi"
              hint="da Entra ID"
            />
            <Field
              id="f-email"
              label="Email aziendale"
              type="email"
              defaultValue="marco.bianchi@azienda.it"
            />
            <Field
              id="f-pattern"
              label="Pattern settimanale"
              placeholder="Es. martedì + giovedì"
              error
              helperText="Seleziona almeno un giorno per attivare il pattern ricorrente."
            />
            <Field
              id="f-visibility"
              label="Visibilità presenze"
              select
              defaultValue="company"
              helperText="Puoi cambiare in qualsiasi momento. Si applica anche allo storico."
            >
              <MenuItem value="company">Tutti i colleghi</MenuItem>
              <MenuItem value="team">Solo il mio team</MenuItem>
              <MenuItem value="followers">Solo chi mi segue</MenuItem>
              <MenuItem value="hidden">Modalità incognito</MenuItem>
            </Field>
            <Field
              id="f-note"
              label="Nota giornaliera"
              optional
              placeholder="Es. Disponibile per coffee chat dopo le 11"
              helperText="Massimo 280 caratteri. Visibile solo al tuo team."
              multiline
              rows={3}
            />
            <Field
              id="f-disabled"
              label="Account email"
              defaultValue="marco.bianchi@azienda.it"
              disabled
              hint="readonly"
              helperText="Sincronizzata da Entra ID, non modificabile."
            />
          </Box>
        </ShowcaseSection>

        {/* 7 — Badges */}
        <ShowcaseSection
          eyebrow="06 · Badge"
          title="Stati di presenza."
          intro="I chip mappano 1:1 gli stati che vivono nell'app: in ufficio, remoto, last-minute, nascosto. Niente etichette generiche."
        >
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Chip label="In ufficio" sx={{ backgroundColor: semantic.successSubtle, color: semantic.success, fontWeight: 600 }} />
            <Chip label="Remoto" variant="outlined" />
            <Chip label="Last-minute" sx={{ backgroundColor: semantic.warningSubtle, color: brand.primaryActive, fontWeight: 600 }} />
            <Chip label="Nascosto" variant="outlined" sx={{ borderStyle: 'dashed' }} />
            <Chip label="Non specificato" sx={{ backgroundColor: surface.paperAlt }} />
            <Chip
              label="Tu"
              sx={{
                backgroundColor: brand.primarySubtle,
                color: brand.primaryText,
                border: `1px solid ${brand.primary}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label="HR · vista aggregata"
              sx={{
                backgroundColor: semantic.infoSubtle,
                color: semantic.info,
                fontWeight: 600,
              }}
            />
            <Chip label="Errore validazione" sx={{ backgroundColor: semantic.dangerSubtle, color: semantic.danger, fontWeight: 600 }} />
          </Stack>
        </ShowcaseSection>

        {/* 8 — Radius + Spacing */}
        <ShowcaseSection
          eyebrow="07 · Forme & Ritmo"
          title="Radius e spacing."
          intro="Scala radius 0/4/8/12/16/20 + pill solo per chip persona. Spacing su base 4px, scala discreta."
        >
          <Stack spacing={6}>
            <Stack spacing={2}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Radius
              </Typography>
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 3 }}>
                {RADII_TOKENS.map((r) => (
                  <Stack key={r.name} spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 96,
                        height: 96,
                        backgroundColor: surface.paperAlt,
                        border: `1px solid ${border.default}`,
                        borderRadius: `${r.value}px`,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}>
                      {r.value === 32 ? '9999' : r.value}px · {r.use}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Stack spacing={2}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Spacing
              </Typography>
              <Stack spacing={2} sx={{ maxWidth: 720 }}>
                {SPACING_KEYS.map((k) => (
                  <Stack key={String(k)} direction="row" spacing={3} alignItems="center">
                    <Typography variant="body2" sx={{ fontFamily: 'var(--font-jetbrains)', minWidth: 32 }}>
                      {k}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)', minWidth: 48 }}>
                      {spacingTokens[k]}px
                    </Typography>
                    <Box
                      sx={{
                        height: 12,
                        width: spacingTokens[k],
                        backgroundColor: ink.primary,
                        borderRadius: `${radii.xs}px`,
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </ShowcaseSection>

        {/* 9 — Do / Don't */}
        <ShowcaseSection
          eyebrow="08 · Regole"
          title="Cosa fare. Cosa non fare."
          intro="Estratto dalle sezioni §9 di .workflow/DESIGN.md. Le regole proteggono il segnale: ogni eccezione va discussa prima di andare in produzione."
        >
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Card sx={{ backgroundColor: semantic.successSubtle, borderColor: 'transparent' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h3" sx={{ color: semantic.success, fontWeight: 700 }}>
                    Do
                  </Typography>
                  <Stack component="ul" spacing={1.5} sx={{ pl: 2.5, m: 0 }}>
                    {DO_RULES.map((rule, i) => (
                      <Typography key={i} component="li" variant="body2" sx={{ color: ink.primary }}>
                        {rule}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: semantic.dangerSubtle, borderColor: 'transparent' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h3" sx={{ color: semantic.danger, fontWeight: 700 }}>
                    Don&apos;t
                  </Typography>
                  <Stack component="ul" spacing={1.5} sx={{ pl: 2.5, m: 0 }}>
                    {DONT_RULES.map((rule, i) => (
                      <Typography key={i} component="li" variant="body2" sx={{ color: ink.primary }}>
                        {rule}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </ShowcaseSection>

        <SiteFooter />
      </Box>
    </>
  );
}
