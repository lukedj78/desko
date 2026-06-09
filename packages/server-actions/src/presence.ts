'use server';

import { randomUUID } from 'node:crypto';

import { and, eq, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUserId } from '@desko/auth/server';
import { db } from '@desko/db';
import { follows, presenceEntries, user as userTable, weeklyPatterns } from '@desko/db/schema';
import type { ActionResult, Floor, PresenceStatus } from '@desko/domain';

/**
 * Server actions per il dominio "presence" — implementazione reale Drizzle.
 *
 * Convenzioni:
 *   1. Mai THROW oltre il confine server: ritorna sempre `ActionResult<T>`.
 *      Eccezione: `getCurrentUserId()` lancia `UNAUTHORIZED` (errore di sistema,
 *      gestito dall'error boundary di Next).
 *   2. Validazione Zod a inizio funzione, errori formattati con `flattenZod()`.
 *   3. `revalidatePath` su tutte le pagine impattate dopo ogni mutation.
 *   4. Tutte le actions sono single-tenant (1 utente = 1 dominio).
 */

// ─── Validation schemas ─────────────────────────────────────────────────────

const dateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve essere in formato YYYY-MM-DD');

const presenceStatusSchema = z.enum(['in_office', 'remote', 'unspecified']);
const floorSchema = z.enum(['seventh_floor', 'second_floor']);

const declarePresenceSchema = z.object({
  date: dateIsoSchema,
  status: presenceStatusSchema,
  floor: floorSchema.nullable().optional(),
  note: z.string().max(280).optional(),
});

const updateFloorSchema = z.object({
  date: dateIsoSchema,
  floor: floorSchema.nullable(),
});

const weeklyPatternSchema = z.object({
  monday: presenceStatusSchema.default('unspecified'),
  tuesday: presenceStatusSchema.default('unspecified'),
  wednesday: presenceStatusSchema.default('unspecified'),
  thursday: presenceStatusSchema.default('unspecified'),
  friday: presenceStatusSchema.default('unspecified'),
  defaultFloor: floorSchema.nullable().optional(),
});

const updateVisibilitySchema = z.object({
  visibility: z.enum(['company', 'team', 'followers', 'hidden']),
});

const declareWeekSchema = z.object({
  weekStart: dateIsoSchema,
  days: z
    .array(
      z.object({
        date: dateIsoSchema,
        status: presenceStatusSchema,
        floor: floorSchema.nullable().optional(),
      }),
    )
    .min(1)
    .max(7),
});

const followSchema = z.object({ targetUserId: z.string().min(1) });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flattenZod(error: z.ZodError): { message: string; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return {
    message: 'Validazione fallita: controlla i campi evidenziati.',
    fieldErrors,
  };
}

const LAST_MINUTE_HOUR = 8; // dopo le 08:00 del giorno stesso = last-minute

function isLastMinute(targetDate: string): boolean {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return targetDate === todayIso && today.getHours() >= LAST_MINUTE_HOUR;
}

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  revalidatePath('/floors');
  revalidatePath('/settings');
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Dichiara la presenza per un singolo giorno (US-1).
 * Upsert: se esiste già una presenza per (userId, date), la aggiorna.
 */
export async function declarePresence(
  input: z.infer<typeof declarePresenceSchema>,
): Promise<ActionResult<{ date: string; status: PresenceStatus; floor: Floor | null }>> {
  const parsed = declarePresenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();
    const { date, status, floor, note } = parsed.data;
    const isLM = status === 'in_office' && isLastMinute(date);

    await db
      .insert(presenceEntries)
      .values({
        id: randomUUID(),
        userId,
        date,
        status,
        floor: floor ?? null,
        note: note ?? null,
        isLastMinute: isLM,
        fromPattern: false,
        lastFloorUpdateAt: floor ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          status,
          floor: floor ?? null,
          note: note ?? null,
          isLastMinute: isLM,
          fromPattern: false,
          lastFloorUpdateAt: floor ? new Date() : null,
          updatedAt: new Date(),
        },
      });

    revalidateAll();

    return { ok: true, data: { date, status, floor: floor ?? null } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore inatteso nella dichiarazione di presenza.',
    };
  }
}

/**
 * Aggiorna SOLO il piano per la presenza di una data specifica (US-7).
 * Pensata per il flow "Sposta al 2°" durante la giornata.
 */
export async function updateFloor(
  input: z.infer<typeof updateFloorSchema>,
): Promise<ActionResult<{ floor: Floor | null; updatedAt: string }>> {
  const parsed = updateFloorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();
    const now = new Date();

    // Upsert: se non c'è una row per oggi, la creiamo come 'in_office' con il piano scelto.
    await db
      .insert(presenceEntries)
      .values({
        id: randomUUID(),
        userId,
        date: parsed.data.date,
        status: 'in_office',
        floor: parsed.data.floor,
        isLastMinute: isLastMinute(parsed.data.date),
        fromPattern: false,
        lastFloorUpdateAt: now,
      })
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          floor: parsed.data.floor,
          status: 'in_office',
          lastFloorUpdateAt: now,
          updatedAt: now,
        },
      });

    revalidatePath('/dashboard');
    revalidatePath('/floors');

    return { ok: true, data: { floor: parsed.data.floor, updatedAt: now.toISOString() } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nello spostamento di piano.',
    };
  }
}

/**
 * Esce dall'ufficio per oggi: marca la presenza come 'remote'.
 * Equivalente a "annullo la mia presenza in ufficio dichiarata stamattina".
 */
export async function leaveOffice(): Promise<ActionResult<{ status: PresenceStatus }>> {
  try {
    const userId = await getCurrentUserId();
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await db
      .insert(presenceEntries)
      .values({
        id: randomUUID(),
        userId,
        date: todayIso,
        status: 'remote',
        floor: null,
        isLastMinute: false,
        fromPattern: false,
      })
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          status: 'remote',
          floor: null,
          updatedAt: new Date(),
        },
      });

    revalidateAll();
    return { ok: true, data: { status: 'remote' } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore.',
    };
  }
}

/**
 * Update batch settimanale: assegna stati per più giorni in una sola call.
 * Usato dalla `/calendar` quando l'utente conferma la settimana.
 */
export async function declareWeek(
  input: z.infer<typeof declareWeekSchema>,
): Promise<ActionResult<{ count: number }>> {
  const parsed = declareWeekSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();
    const rows = parsed.data.days.map((d) => ({
      id: randomUUID(),
      userId,
      date: d.date,
      status: d.status,
      floor: d.floor ?? null,
      isLastMinute: d.status === 'in_office' && isLastMinute(d.date),
      fromPattern: false,
      lastFloorUpdateAt: d.floor ? new Date() : null,
    }));

    for (const row of rows) {
      await db
        .insert(presenceEntries)
        .values(row)
        .onConflictDoUpdate({
          target: [presenceEntries.userId, presenceEntries.date],
          set: {
            status: row.status,
            floor: row.floor,
            isLastMinute: row.isLastMinute,
            fromPattern: false,
            lastFloorUpdateAt: row.lastFloorUpdateAt,
            updatedAt: new Date(),
          },
        });
    }

    revalidateAll();
    return { ok: true, data: { count: rows.length } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore aggiornamento settimanale.',
    };
  }
}

/**
 * Pattern ricorrente settimanale (US-1). Upsert su (userId).
 */
export async function updateWeeklyPattern(
  input: z.infer<typeof weeklyPatternSchema>,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = weeklyPatternSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();

    await db
      .insert(weeklyPatterns)
      .values({
        id: randomUUID(),
        userId,
        ...parsed.data,
        defaultFloor: parsed.data.defaultFloor ?? null,
      })
      .onConflictDoUpdate({
        target: weeklyPatterns.userId,
        set: {
          monday: parsed.data.monday,
          tuesday: parsed.data.tuesday,
          wednesday: parsed.data.wednesday,
          thursday: parsed.data.thursday,
          friday: parsed.data.friday,
          defaultFloor: parsed.data.defaultFloor ?? null,
          updatedAt: new Date(),
        },
      });

    revalidatePath('/calendar');
    revalidatePath('/settings');

    return { ok: true, data: { updated: true } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nel salvataggio del pattern settimanale.',
    };
  }
}

/**
 * Aggiorna la visibilità delle proprie presenze (US-5).
 */
export async function updateVisibility(
  input: z.infer<typeof updateVisibilitySchema>,
): Promise<ActionResult<{ visibility: 'company' | 'team' | 'followers' | 'hidden' }>> {
  const parsed = updateVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();

    await db
      .update(userTable)
      .set({ presenceVisibility: parsed.data.visibility, updatedAt: new Date() })
      .where(eq(userTable.id, userId));

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/floors');

    return { ok: true, data: { visibility: parsed.data.visibility } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nel salvataggio della visibilità.',
    };
  }
}

/**
 * Diritto all'oblio (US-5): cancella tutto lo storico delle presenze passate
 * dell'utente corrente. Hard delete.
 */
export async function archivePastPresences(): Promise<ActionResult<{ archivedCount: number }>> {
  try {
    const userId = await getCurrentUserId();

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const deleted = await db
      .delete(presenceEntries)
      .where(
        and(
          eq(presenceEntries.userId, userId),
          // Solo le date strettamente passate; lasciamo invariate quelle di oggi e future
          lt(presenceEntries.date, todayIso),
        ),
      )
      .returning({ id: presenceEntries.id });

    revalidatePath('/settings');
    revalidatePath('/calendar');

    return { ok: true, data: { archivedCount: deleted.length } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nella cancellazione dello storico.',
    };
  }
}

/**
 * Segui un collega (US-3).
 */
export async function followUser(
  input: z.infer<typeof followSchema>,
): Promise<ActionResult<{ followed: true }>> {
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();

    if (userId === parsed.data.targetUserId) {
      return {
        ok: false,
        message: 'Non puoi seguire te stesso.',
      };
    }

    await db
      .insert(follows)
      .values({
        id: randomUUID(),
        followerId: userId,
        followedId: parsed.data.targetUserId,
      })
      .onConflictDoNothing({ target: [follows.followerId, follows.followedId] });

    revalidatePath('/dashboard');
    revalidatePath('/calendar');
    revalidatePath('/settings');

    return { ok: true, data: { followed: true } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nel follow.',
    };
  }
}

/**
 * Smetti di seguire un collega (US-3).
 */
export async function unfollowUser(
  input: z.infer<typeof followSchema>,
): Promise<ActionResult<{ unfollowed: true }>> {
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, ...flattenZod(parsed.error) };
  }

  try {
    const userId = await getCurrentUserId();

    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          eq(follows.followedId, parsed.data.targetUserId),
        ),
      );

    revalidatePath('/dashboard');
    revalidatePath('/calendar');
    revalidatePath('/settings');

    return { ok: true, data: { unfollowed: true } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Errore nell\'unfollow.',
    };
  }
}
