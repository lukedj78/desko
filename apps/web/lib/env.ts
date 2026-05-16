import { z } from 'zod';

/**
 * Server-only environment variables.
 *
 * Validato a boot del modulo: se manca o è invalido, l'app si rifiuta di partire
 * con un messaggio chiaro invece di fallire in produzione al primo accesso a un valore.
 *
 * Nuove variabili → aggiungile sia allo schema che all'oggetto finale di export.
 * Variabili che vanno esposte al client → prefissarle `NEXT_PUBLIC_` e validarle
 * nello schema `clientSchema` (devono comparire nel bundle).
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Database (module-add db) — Neon Postgres connection string (pooled URL).
  // Funziona sia per runtime app (neon-http) sia per migrations (neon-serverless WebSocket).
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://placeholder:placeholder@placeholder/placeholder'),
  // Auth (module-add auth)
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, 'genera con: openssl rand -base64 32')
    .default('dev-secret-replace-in-production-with-openssl-rand-base64-32'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3010'),
  // Microsoft Entra ID — placeholder finché Azure App Registration non è pronta.
  // L'auth si configura per usarlo solo se i valori sono valorizzati (non placeholder).
  MICROSOFT_CLIENT_ID: z.string().default('placeholder'),
  MICROSOFT_CLIENT_SECRET: z.string().default('placeholder'),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  // Email (module-add email) — Resend
  RESEND_API_KEY: z.string().default('placeholder'),
  RESEND_FROM_EMAIL: z.string().default('Desko <onboarding@resend.dev>'),
  RESEND_DEV_TO: z.string().email().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Desko'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3010'),
});

const parsedServer = serverSchema.safeParse(process.env);

if (!parsedServer.success) {
  const issues = parsedServer.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `❌ Variabili d'ambiente server invalide o mancanti:\n${issues}\n\nControlla .env.local`,
  );
}

const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsedClient.success) {
  const issues = parsedClient.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `❌ Variabili d'ambiente client invalide:\n${issues}\n\nControlla .env.local`,
  );
}

export const env = {
  ...parsedServer.data,
  ...parsedClient.data,
} as const;

export type Env = typeof env;
