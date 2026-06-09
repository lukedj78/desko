# ⚠️ App congelata — 2026-06-09

`apps/web` (MUI) è il port originale dell'app Desko, **congelato** in favore di
`apps/web-shadcn` (Base UI), che dal 16 maggio 2026 è l'app web canonica.

- Esclusa da `build` / `dev` / `lint` / `type-check` root via
  `--filter=!@desko/web` (vedi `package.json` root).
- Resta nel repo come riferimento al port pixel-perfect MUI ↔ shadcn
  (vedi `MUI-vs-SHADCN.md` in web-shadcn).
- Usa i packages condivisi `@desko/*`: può compilare ma **non viene più
  mantenuta** — nuove feature (temi runtime, forms toolkit, rotte EN,
  privacy GDPR) esistono solo in web-shadcn.

Per eseguirla comunque: `pnpm --filter @desko/web dev`.
