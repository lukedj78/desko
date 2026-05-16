import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';

import { db, schema } from '@desko/db';
import { sendEmail } from '@desko/email';
import { ResetPasswordEmail } from '@desko/email/templates/reset-password';
import { VerifyEmail } from '@desko/email/templates/verify-email';
import { env } from '@desko/env';

import { ac, ROLES } from './permissions';

/**
 * better-auth core config (server-only).
 *
 * Provider: Email/password sempre on, Microsoft Entra ID condizionale.
 * Plugin: admin per gestione ruoli/ban/impersonate.
 * Schema: tabelle user/session/account/verification da @desko/db.
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
    sendOnSignUp: false,
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
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    cookiePrefix: 'desko',
  },
});

export type Session = typeof auth.$Infer.Session;
