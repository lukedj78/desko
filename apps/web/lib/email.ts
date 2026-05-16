import { Resend } from 'resend';
import type { ReactElement } from 'react';

import { env } from '@/lib/env';

/**
 * Helper centralizzato per l'invio di email transazionali via Resend.
 *
 * Tre regole baked-in:
 *   1. **Dev redirect**: in non-production, se `RESEND_DEV_TO` è settato, TUTTE
 *      le email vengono redirette a quell'indirizzo invece dei reali destinatari.
 *      Senza questo, un test dimenticato manda mail vere a utenti veri.
 *   2. **Tag obbligatorio**: ogni invio deve avere un `tag` (es. 'verify-email',
 *      'reset-password', 'welcome') così Resend dashboard raggruppa per template
 *      e debug della deliverability è possibile.
 *   3. **No throw**: torna `{ ok: false, error }` invece di lanciare. Mantiene
 *      il pattern `ActionResult<T>` delle server actions.
 *
 * NB: in modalità placeholder (RESEND_API_KEY === 'placeholder') l'invio è
 * skippato — utile per dev senza chiave reale, log nel terminale invece.
 */

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  tag: string;
  replyTo?: string;
};

type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const resend =
  env.RESEND_API_KEY !== 'placeholder' ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const isProd = env.NODE_ENV === 'production';
  const devTo = env.RESEND_DEV_TO;

  // Redirect in non-prod a un indirizzo dev-only se settato
  const to =
    !isProd && devTo
      ? [devTo]
      : Array.isArray(params.to)
      ? params.to
      : [params.to];

  // Modalità placeholder: log nel terminale, non spedire davvero
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
