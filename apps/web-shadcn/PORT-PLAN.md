# Desko shadcn port — Piano di porting 1:1 da MUI

> Branch: `feat/shadcn-port`
> Riferimento: app MUI in [apps/web/](../web)
> Obiettivo: stessa app, stesso DB, stesse user stories, **UI in shadcn/ui** (Radix + Tailwind 4) invece di MUI, per confronto diretto delle due librerie sullo stesso problema reale.

## Decisioni di architettura

### Backend condiviso
Le due app condividono **lo stesso database**, **gli stessi schemi Drizzle**, **gli stessi server actions** e **le stesse query** — l'unica cosa che cambia è la UI. Questo dà un confronto pulito MUI vs shadcn senza variabili confondenti.

Strategia: `apps/web-shadcn/tsconfig.json` ha path alias `@desko/server/*` → `../web/lib/*` per importare direttamente:
- `lib/db/*` (schema, connection)
- `lib/queries/*` (read-side)
- `lib/server/*` (server actions con `'use server'`)
- `lib/auth.ts`, `lib/auth-server.ts`, `lib/auth-permissions.ts`
- `lib/presence-domain.ts`

NON condividiamo:
- Componenti UI (per definizione)
- Pagine
- `lib/auth-client.ts` (è 'use client' e dipende dall'app)

> Trade-off: l'app-shadcn dipende dalla struttura interna di `apps/web/lib`. Quando il porting è completo, valutare se estrarre in `packages/desko-core`.

### Sessione condivisa
Better-auth scrive cookie con prefisso `desko`. Le due app girano su porte diverse (web=3010, web-shadcn=3020) → cookie cross-port non condivisi. **Login separato per ogni app** (intenzionale: si testa il flusso completo in ogni UI).

### DB condiviso
Stesso `DATABASE_URL` in entrambe le `.env.local`. Nessuna migration aggiuntiva — l'app-shadcn legge/scrive sulle stesse tabelle dell'app-MUI.

## Mapping tokens DESIGN.md → shadcn

Tutti i tokens del DESIGN.md vengono espressi come CSS variables shadcn in `app/globals.css` (formato HSL come da convenzione shadcn), così le primitives generate da `shadcn add` ereditano automaticamente la palette.

| Token MUI | shadcn CSS variable | Valore |
|---|---|---|
| `primary.main` `#E8B931` | `--primary` | `42 80% 56%` |
| `primary.dark` `#5A4500` | `--primary-foreground` | `42 100% 11%` |
| `background.paper` `#FFFFFF` | `--background` | `0 0% 100%` |
| `background.default` `#FAF7F2` | `--muted` | `38 31% 96%` |
| `text.primary` `#0E0F0C` | `--foreground` | `80 8% 5%` |
| `text.secondary` `#5C5C58` | `--muted-foreground` | `60 2% 36%` |
| `divider` `#E5E2DC` | `--border` | `42 14% 88%` |
| `error.main` `#C73E44` | `--destructive` | `357 56% 51%` |
| `success.main` `#2D7A3F` | `--success` | `133 47% 33%` |
| `info.main` `#3D87C9` | `--info` | `207 53% 51%` |

Font:
- `--font-inter` → headings + body
- `--font-jetbrains` → numerici/code

Radius:
- `--radius`: `0.5rem` (8px) — match con MUI `borderRadius: 8`

## Mapping componenti MUI → shadcn

| MUI | shadcn equivalente | Note |
|---|---|---|
| `Button` | `button` (cva variants: default/destructive/outline/secondary/ghost/link) | size `lg` = 48px, `default` = 40px, `sm` = 36px |
| `IconButton` | `button size="icon"` | |
| `Card` + `CardContent` | `card` | |
| `Stack direction="row" spacing` | `<div class="flex gap-N">` | |
| `Box sx` | `<div className="...">` | Eliminare completamente |
| `Typography` | `<h1>` / `<p>` con classi Tailwind | |
| `OutlinedInput` + custom `Field` | `input` + custom `field` wrapper | Pattern Desko: label statica esterna, NO floating |
| `Select` | `select` (Radix Select) | |
| `Autocomplete` | `command` + `popover` | Pattern Combobox shadcn |
| `Dialog` | `dialog` (Radix Dialog) | |
| `Menu` + `MenuItem` | `dropdown-menu` (Radix DropdownMenu) | |
| `Tooltip` | `tooltip` (Radix Tooltip) | |
| `Avatar` + `AvatarGroup` | `avatar` (Radix Avatar) + custom group con `flex -space-x-2` | |
| `Chip` | `badge` (cva variants) | |
| `Table` | `table` (HTML table + classi) | |
| `Snackbar` + `Alert` | `sonner` (toast) | |
| `Drawer` | `sheet` | |
| `Tabs` | `tabs` (Radix Tabs) | |
| `Switch` | `switch` (Radix Switch) | |
| `ToggleButtonGroup` | `toggle-group` (Radix Toggle Group) | |
| `BottomNavigation` (mobile) | Custom con `flex` + `sheet` per drawer | Non c'è equivalente shadcn diretto |
| `AppBar` + `Toolbar` | Custom con `<header className="sticky top-0">` | |
| `CircularProgress` | `<div className="animate-spin">` con bordo | shadcn non ha spinner, inline |
| `MUI theme.palette.warning` | `--warning` custom | shadcn non ha "warning" di default, lo aggiungo |

Custom Desko da riportare 1:1:
- `Field` (label statica) → `components/ui/field.tsx`
- `Eyebrow` → `components/ui/eyebrow.tsx`
- `FloorBadge` → `components/site/floor-badge.tsx`
- `EmployeeHoverCard` → `components/site/employee-hover-card.tsx`
- `UserDropdown` → `components/site/user-dropdown.tsx`
- `PasswordField` + `PasswordStrengthMeter` → `components/site/password-field.tsx`
- `AppShell` (sidebar collassabile + topbar + mobile bottom nav) → `components/site/app-shell.tsx`
- `ImpersonationBanner` → `app/(app)/_components/impersonation-banner.tsx`
- `MyPresenceItem` → `app/(app)/calendar/_components/my-presence-item.tsx`

## Roadmap di porting — 7 fasi

### Fase 0 — Setup ✅ (questa sessione)
- Branch `feat/shadcn-port`
- `apps/web-shadcn/` scaffold (Next 16 + Tailwind 4 + shadcn init)
- `globals.css` + `tailwind.config` con tokens DESIGN.md
- `shadcn add` di tutte le primitives elencate sopra
- Path alias backend (`@desko/server/*` → `../web/lib/*`)
- Landing page (`app/page.tsx`) come proof-of-concept del look & feel

### Fase 1 — Auth pages (~½ giorno)
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`
- Pattern Field statico, password-strength-meter
- Microsoft button (placeholder)

### Fase 2 — AppShell + layout (app) (~½ giorno)
- Sidebar collassabile desktop (sheet su mobile)
- TopBar con UserDropdown + notifications + help
- BottomNavigation mobile
- ImpersonationBanner
- Layout (app) con session gate

### Fase 3 — Dashboard + Calendar (~1 giorno)
- Dashboard: KPI cards, check-in card, floor occupancy, colleghi in ufficio
- Calendar: vista mese navigabile + vista giorno con sezioni piano + MyPresenceItem interattivo

### Fase 4 — Piani + Impostazioni (~½ giorno)
- Piani: 7° vs 2°, badge, filtri
- Impostazioni: pattern settimanale, visibilità, follows, profilo

### Fase 5 — Admin (~1 giorno)
- /admin/users: table con sort/filter, dialog azioni (impersona/banna/elimina), dialog crea utente
- /admin/analytics: KPI + bar chart + trend list (no librerie chart, custom come MUI)

### Fase 6 — Lunch (~1 giorno)
- /lunch: lista proposte oggi/domani, RestaurantsGrid con rating stars
- Dialog crea proposta con Combobox shadcn (replace Autocomplete)
- Toggle pubblica/privata, multi-select invitati

### Fase 7 — Showcase + polish (~½ giorno)
- /showcase comparativo: griglia di componenti shadcn renderizzati con gli stessi token MUI
- Lighthouse score comparison
- Bundle size diff
- Note finali di confronto in `COMPARISON.md`

## Confronto finale

Al termine, creare `docs/MUI-vs-SHADCN.md` con:
- Bundle size (kB initial JS) confronto
- Lighthouse Performance / Accessibility / Best Practices
- Tempo di compilazione (Turbopack)
- LOC dei componenti custom
- Note qualitative: developer ergonomics, ease of theming, accessibilità default, complessità API
