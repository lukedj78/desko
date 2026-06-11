import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@desko/db';
import { pushTokens } from '@desko/db/schema';
import type { ActionResult } from '@desko/domain';

/**
 * Servizio push notifications — token registry + invio via Expo Push API.
 * Pure (niente Next): l'invio è un POST a exp.host, niente SDK nativi.
 */

const registerSchema = z.object({
  token: z.string().min(10).max(200).startsWith('ExponentPushToken'),
  platform: z.enum(['ios', 'android']),
});

export type RegisterPushTokenInput = z.infer<typeof registerSchema>;

/** Upsert del token: ri-associato all'utente corrente a ogni registrazione. */
export async function registerPushToken(
  userId: string,
  input: RegisterPushTokenInput,
): Promise<ActionResult<{ registered: true }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Push token non valido.' };
  }

  await db
    .insert(pushTokens)
    .values({
      token: parsed.data.token,
      userId,
      platform: parsed.data.platform,
    })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId, platform: parsed.data.platform, updatedAt: new Date() },
    });

  return { ok: true, data: { registered: true } };
}

/** Rimuove il token (logout / revoca). */
export async function unregisterPushToken(token: string): Promise<void> {
  await db.delete(pushTokens).where(eq(pushTokens.token, token));
}

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Invia una notifica a tutti i device degli utenti indicati via Expo Push API.
 *
 * Fire-and-forget per design: logga e NON rilancia — una notifica fallita
 * non deve mai far fallire la mutation che l'ha originata. I token rifiutati
 * come `DeviceNotRegistered` vengono rimossi.
 */
export async function notifyUsers(userIds: string[], message: PushMessage): Promise<void> {
  if (userIds.length === 0) return;

  try {
    const rows = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(inArray(pushTokens.userId, userIds));
    if (rows.length === 0) return;

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        rows.map((r) => ({
          to: r.token,
          title: message.title,
          body: message.body,
          data: message.data ?? {},
          sound: 'default',
        })),
      ),
    });

    const payload = (await res.json().catch(() => null)) as {
      data?: Array<{ status: string; details?: { error?: string } }>;
    } | null;

    // Pulizia token morti (app disinstallata, permessi revocati)
    const dead: string[] = [];
    payload?.data?.forEach((ticket, i) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        const token = rows[i]?.token;
        if (token) dead.push(token);
      }
    });
    if (dead.length > 0) {
      await db.delete(pushTokens).where(inArray(pushTokens.token, dead));
    }
  } catch (e) {
    console.error('[push] invio fallito:', e instanceof Error ? e.message : e);
  }
}
