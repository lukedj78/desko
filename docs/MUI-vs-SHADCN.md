# Desko — MUI vs shadcn/ui

Documento di confronto tra le due implementazioni dell'app Desko nel monorepo:

- `apps/web` — Material UI 6 + Emotion
- `apps/web-shadcn` — Tailwind CSS 4 + shadcn/ui (Radix UI primitives + cva)

Entrambe le app:
- **stesso backend** via 7 packages workspace (`@desko/{env,db,domain,email,auth,queries,server-actions}`)
- **stesso DB Postgres** (Neon, lo stesso `DATABASE_URL`)
- **stesso seed** (13 utenti, 422+ presenze, 8 ristoranti, 20 follows, 24 ratings)
- **stesso schema Drizzle** + **stesso better-auth setup**
- **stesso DESIGN.md tokens** (palette ocra Desko, font Inter + JetBrains)

Le pagine portate 1:1 (porting pixel-perfect su branch `feat/shadcn-port-pixel-perfect`):

| Pagina | MUI | shadcn |
|---|---|---|
| `/` landing | ✅ | ✅ pixel-perfect |
| `/login` | ✅ | ✅ pixel-perfect |
| `/signup` | ✅ | ✅ pixel-perfect |
| `/forgot-password` | ✅ | ✅ pixel-perfect |
| `/reset-password` | ✅ | ✅ pixel-perfect |
| `/verify-email` | ✅ | ✅ pixel-perfect |
| `/dashboard` | ✅ | ✅ pixel-perfect (CheckIn + Occupancy donut + Colleghi grid + banner ocra + KPI strip) |
| `/calendar` (mese + giorno + MyPresenceItem) | ✅ | ✅ pixel-perfect |
| `/piani` | ✅ | ✅ pixel-perfect (FloorCard con banner + chip "Sei qui" + "Disponibile" + bullets + team + avatar + Sposta button) |
| `/impostazioni` | ✅ | ✅ pixel-perfect (Bento grid + MilanoSkylineHero SVG + Switch toggles + Field Select) |
| `/admin/users` | ✅ | ✅ pixel-perfect |
| `/admin/analytics` | ✅ | ✅ pixel-perfect |
| `/lunch` | ✅ | ✅ pixel-perfect |

## Come testare

Entrambe le app girano in parallelo sullo stesso DB:

```bash
# Terminal 1 — MUI app
pnpm --filter @desko/web dev    # http://localhost:3010

# Terminal 2 — shadcn app
pnpm --filter @desko/web-shadcn dev    # http://localhost:3020
```

Login (entrambe le app, stesso DB):
- `admin@desko.local` / `demo12345` → admin
- `hr@desko.local` / `Demo@123` → hr_analytics
- `mario.rossi@desko.local` / `Demo@123` → user standard

## Confronto qualitativo

### Bundle size & performance

Da misurare con `pnpm --filter <app> build`:
- MUI: Emotion CSS-in-JS runtime + MUI core (~250kB initial JS minimo)
- shadcn: Tailwind 4 utility classes (CSS statico, ~0kB JS runtime) + Radix primitives tree-shakeable

### Developer ergonomics

| Aspetto | MUI | shadcn |
|---|---|---|
| **API styling** | `sx` prop con object styles + theme.palette aliases | classi Tailwind con CSS variables HSL |
| **Custom component** | extend `theme.components.MuiX.styleOverrides` | copia il source nel proprio repo, modifica |
| **Theme** | `ThemeProvider` con `createTheme()` | CSS variables in `globals.css` |
| **Tree-shaking** | named imports per icon (`@mui/icons-material/X`), Emotion runtime sempre presente | tree-shakeable nativo |
| **Accessibility default** | buona ma da verificare per role/aria | eccellente (Radix porta WAI-ARIA spec) |
| **Server Components compat** | richiede `@mui/material-nextjs` + setup Emotion cache | compat nativa (componenti come pure HTML/CSS) |
| **Time-to-component** | importi, usi `sx` | apri shadcn registry, copia il file |

### Code complexity

| Componente | MUI righe | shadcn righe |
|---|---|---|
| Landing | 628 | 320 |
| Calendar (page + grid + day + MyPresenceItem) | 1351 + 329 = 1680 | 670 + 220 = 890 |
| Lunch (proposals list) | ~400 | ~190 |
| Admin users client | 775 | 480 |
| AppShell | ~400 | ~190 |

shadcn ha generalmente **meno righe** perché:
- Niente `sx={{...}}` object expansion verboso
- Tailwind utility classes compatte
- Componenti shadcn più "thin" (pure JSX + cva variants)

Costo: meno discoverability del design system (non c'è autocompletion dei valori, ma usi solo CSS classes).

## Decisione tecnica

Per Desko entrambe le app sono valide. Considerazioni:

- **Se l'azienda ha designer Figma con un design system disciplinato** → shadcn vince perché ogni componente è source che il designer può "owned" e modificare.
- **Se serve velocità di prototipazione su feature standard (data tables, dialog, autocomplete)** → MUI vince perché ha più componenti pronti e più ricchi.
- **Se la priorità è bundle size e SSR performance** → shadcn vince per leggerezza runtime.
- **Se serve un design Material-faithful** → MUI naturalmente.

Per il caso Desko (UI custom con palette ocra distintiva, GDPR-first single-tenant), **shadcn era leggermente più adatto** ma MUI è altrettanto valido — entrambe le app sono in production-ready state lato look.

## Stato finale del porting

Il branch `feat/shadcn-port-pixel-perfect` chiude il porting in modalità
**screenshot-driven pixel-perfect**: per ogni pagina si è preso lo screenshot
MUI a 1400×900 viewport, lo si è confrontato con la versione shadcn, si sono
identificate le differenze (copy, spacing, colori, struttura) e si è
iterato fino al visual match.

I commit pixel-perfect per pagina:
- `793790f` dashboard
- `b3233fd` landing
- `0260adc` auth × 5
- `6d278cd` calendar mese
- `617a166` calendar giorno
- `0676ead` piani
- `9144da7` impostazioni (con Milano skyline SVG + Switch)
- admin/users + admin/analytics + lunch: già pixel-perfect, no diff

Cosa ha richiesto rewrite significativo:
- **Dashboard** — completamente rifatto (CheckInHeroCard, OccupancyHeroCard
  con donut conic-gradient, ColleagueHorizontalCard, banner ocra, KPI strip)
- **Piani** — rewrite della FloorCard con banner top + chip "Sei qui" /
  "Disponibile" + tagline pinned + body con count/postazioni + progress
  bar + team breakdown + avatar group + CTA contained ocra
- **Impostazioni** — Bento grid 3-col completo + MilanoSkylineHero SVG
  inline (Duomo + Galleria + Pirellone + Velasca + Bosco Verticale +
  UniCredit Tower) + nuovo `Switch` primitive in `components/ui/`

Cosa ha richiesto solo aggiustamenti minori:
- **Landing** — container max-w-screen-2xl, final CTA max-w-[900px],
  HowItWorks divider my-5, footer py-8
- **Auth × 5** — max-w-md → max-w-[600px], footer mono uppercase → mixed case
- **Calendar** — rimosso badge label "CHIUSURA/TEAM BUILDING" da cell
  (MUI mostra solo dot), "Vedi dettagli giornata" → "Vedi dettagli team"

Cosa era già pixel-perfect senza modifiche:
- Admin users (tabella HTML semantica + Select Ruolo + Stato chip)
- Admin analytics (KPI strip + weekday bars + weekly trend)
- Lunch (header + Oggi empty state + Ristoranti grid 4-col)
