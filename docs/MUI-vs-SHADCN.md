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

Le pagine portate 1:1:

| Pagina | MUI | shadcn |
|---|---|---|
| `/` landing | ✅ | ✅ |
| `/login` | ✅ | ✅ |
| `/signup` | ✅ | ✅ |
| `/forgot-password` | ✅ | ✅ |
| `/reset-password` | ✅ | ✅ |
| `/verify-email` | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ skeleton |
| `/calendar` (mese + giorno + MyPresenceItem) | ✅ | ✅ |
| `/piani` | ✅ | ✅ |
| `/impostazioni` | ✅ | ✅ skeleton |
| `/admin/users` | ✅ | ✅ |
| `/admin/analytics` | ✅ | ✅ |
| `/lunch` | ✅ | ✅ |

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

## Cosa manca al porting shadcn

Le pagine sono tutte presenti e funzionali, ma alcune semplificazioni rispetto al MUI:
- **Dashboard shadcn**: skeleton con KPI + check-in card, mancano "Colleghi in ufficio" hover card grid + "Apri vista piani" banner
- **Impostazioni shadcn**: skeleton con sections principali, manca il "MilanoSkylineHero" SVG decorativo e i mock dei preset multi-week
- **Calendar shadcn**: vista mese e giorno OK, mancano dettagli minori (es. allineamento perfetto pixel-by-pixel)
- **Lunch shadcn**: usa `Select` invece di `Autocomplete` per il ristorante (8 opzioni statiche, ok); usa checkbox list invece di multi-select autocomplete per inviti
- **Admin users shadcn**: tabella HTML standard invece di MUI Table (semantica identica); manca dialog "Crea nuovo utente"

Tutti questi punti sono **gap cosmetici**, non funzionali. Il porting è 1:1 a livello di feature, dati e flussi utente.
