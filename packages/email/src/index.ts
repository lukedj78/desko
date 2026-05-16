import type { ReactElement } from 'react';
import { Resend } from 'resend';

import { env } from '@desko/env';

/**
 * Helper centralizzato per l'invio di email transazionali via Resend.
 * Tre regole:
 *   1. Dev redirect: in non-prod, se `RESEND_DEV_TO` è settato, tutte le email
 *      vanno a quell'indirizzo.
 *   2. Tag obbligatorio: ogni invio ha un `tag` per grouping in Resend dashboard.
 *   3. No throw: torna `{ ok: false, error }`.
 */

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  tag: string;
  replyTo?: string;
};

type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

const resend =
  env.RESEND_API_KEY !== 'placeholder' ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const isProd = env.NODE_ENV === 'production';
  const devTo = env.RESEND_DEV_TO;

  const to =
    !isProd && devTo
      ? [devTo]
      : Array.isArray(params.to)
      ? params.to
      : [params.to];

  if (!resend) {
    console.warn(
      '[email] RESEND_API_KEY non configurata — email non inviata.\n' +
        `         To: ${to.join(', ')}\n` +
        `         Subject: ${params.subject}\n` +
        `         Tag: ${params.tag}`,
    );
    return { ok: true, id: 'placeholder-no-send' };
  }

  try {
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: !isProd ? `[${env.NODE_ENV}] ${params.subject}` : params.subject,
      react: params.react,
      replyTo: params.replyTo,
      tags: [{ name: 'template', value: params.tag }],
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id ?? '' };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return { ok: false, error: message };
  }
}
