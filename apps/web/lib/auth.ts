import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';

import { ac, ROLES } from '@/lib/auth-permissions';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';
import { env } from '@/lib/env';
import { ResetPasswordEmail } from '@/emails/reset-password';
import { VerifyEmail } from '@/emails/verify-email';

/**
 * better-auth core config.
 *
 * Provider abilitati:
 *  - **Email + password**: signup self-service (US-4 Metodo B). Email verification
 *    è opzionale ed è abilitata appena `module-add email` è wired.
 *  - **Microsoft Entra ID** (OIDC/OAuth2, US-4 Metodo A): per ora con placeholder
 *    credentials. Quando Azure App Registration sarà pronta, basta valorizzare
 *    le env vars `MICROSOFT_CLIENT_ID/SECRET/TENANT_ID`.
 *
 * Plugin abilitati:
 *  - **admin**: gestione ruoli (`user` / `admin` / `hr_analytics`), ban, impersonate,
 *    list users via API. Vedi US-8.
 *
 * Schema:
 *  - tabelle `user`, `session`, `account`, `verification` definite in `lib/db/schema.ts`.
 *  - I campi custom (role, team, banned, banReason, ecc.) sono già nello schema —
 *    better-auth li riconosce automaticamente.
 */

const isMicrosoftConfigured =
  env.MICROSOFT_CLIENT_ID &&
  env.MICROSOFT_CLIENT_ID !== 'placeholder' &&
  env.MICROSOFT_CLIENT_SECRET &&
  env.MICROSOFT_CLIENT_SECRET !== 'placeholder';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Per ora signup self-service è aperto (fase test).
    // Quando Microsoft Entra sarà attivo in produzione, restringere via config:
    //   - disableSignUp: true (signup solo via invito admin) oppure
    //   - requireEmailVerification: true (signup aperto ma con verify obbligatorio)
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset password Desko',
        react: ResetPasswordEmail({ name: user.name, resetUrl: url }),
        tag: 'reset-password',
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false, // attivare quando si vuole verify obbligatorio
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Conferma la tua email Desko',
        react: VerifyEmail({ name: user.name, verificationUrl: url }),
        tag: 'verify-email',
      });
    },
  },
  ...(isMicrosoftConfigured
    ? {
        socialProviders: {
          microsoft: {
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
            tenantId: env.MICROSOFT_TENANT_ID,
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
      team: { type: 'string', required: false, input: false },
      department: { type: 'string', required: false, input: false },
      defaultFloor: { type: 'string', required: false, input: false },
      presenceVisibility: {
        type: 'string',
        defaultValue: 'company',
        input: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      ac,
      roles: ROLES,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 giorni
    updateAge: 60 * 60 * 24, // refresh sessione se ultimo update >24h
    cookieCache: { enabled: true, maxAge: 60 * 5 }, // cache cookie 5 min
  },
  advanced: {
    cookiePrefix: 'desko',
  },
});

export type Session = typeof auth.$Infer.Session;
