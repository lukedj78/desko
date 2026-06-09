import { defineConfig } from 'vitest/config';

/**
 * Vitest root config — unit/integration test dei packages condivisi.
 *
 * Environment `node`: la logica sotto test è server-side (queries Drizzle,
 * server actions). I test DB usano PGlite via `@desko/db/testing` — Postgres
 * reale in-process, nessuna credenziale richiesta.
 *
 * I test component (jsdom + Testing Library) e gli e2e Playwright non sono
 * ancora wired — vedi PLAN-NEXT.md priorità test.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['packages/**/src/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    // PGlite ha bisogno di un po' di tempo al primo boot (WASM)
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
