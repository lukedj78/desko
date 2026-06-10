'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUserId } from '@desko/auth/server';
import type { ActionResult, Floor, PresenceStatus } from '@desko/domain';
import * as presence from '@desko/services/presence';
import type {
  DeclarePresenceInput,
  DeclareWeekInput,
  FollowInput,
  UpdateFloorInput,
  UpdateVisibilityInput,
  WeeklyPatternInput,
} from '@desko/services/presence';

/**
 * Server actions "presence" — ADAPTER Next sottile.
 *
 * La logica (Zod, SQL, regole) vive in `@desko/services/presence`.
 * Qui solo le responsabilità di trasporto web:
 *   1. risolvere l'utente dalla sessione (`getCurrentUserId` — THROWA
 *      UNAUTHORIZED: error boundary sul web, 401 via /api per il mobile);
 *   2. delegare al servizio;
 *   3. `revalidatePath` sulle route impattate, solo su successo.
 */

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  revalidatePath('/floors');
  revalidatePath('/settings');
}

export async function declarePresence(
  input: DeclarePresenceInput,
): Promise<ActionResult<{ date: string; status: PresenceStatus; floor: Floor | null }>> {
  const userId = await getCurrentUserId();
  const result = await presence.declarePresence(userId, input);
  if (result.ok) revalidateAll();
  return result;
}

export async function updateFloor(
  input: UpdateFloorInput,
): Promise<ActionResult<{ floor: Floor | null; updatedAt: string }>> {
  const userId = await getCurrentUserId();
  const result = await presence.updateFloor(userId, input);
  if (result.ok) {
    revalidatePath('/dashboard');
    revalidatePath('/floors');
  }
  return result;
}

export async function leaveOffice(): Promise<ActionResult<{ status: PresenceStatus }>> {
  const userId = await getCurrentUserId();
  const result = await presence.leaveOffice(userId);
  if (result.ok) revalidateAll();
  return result;
}

export async function declareWeek(
  input: DeclareWeekInput,
): Promise<ActionResult<{ count: number }>> {
  const userId = await getCurrentUserId();
  const result = await presence.declareWeek(userId, input);
  if (result.ok) revalidateAll();
  return result;
}

export async function updateWeeklyPattern(
  input: WeeklyPatternInput,
): Promise<ActionResult<{ updated: true }>> {
  const userId = await getCurrentUserId();
  const result = await presence.updateWeeklyPattern(userId, input);
  if (result.ok) {
    revalidatePath('/calendar');
    revalidatePath('/settings');
  }
  return result;
}

export async function updateVisibility(
  input: UpdateVisibilityInput,
): Promise<ActionResult<{ visibility: 'company' | 'team' | 'followers' | 'hidden' }>> {
  const userId = await getCurrentUserId();
  const result = await presence.updateVisibility(userId, input);
  if (result.ok) {
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/floors');
  }
  return result;
}

export async function archivePastPresences(): Promise<ActionResult<{ archivedCount: number }>> {
  const userId = await getCurrentUserId();
  const result = await presence.archivePastPresences(userId);
  if (result.ok) {
    revalidatePath('/settings');
    revalidatePath('/calendar');
  }
  return result;
}

export async function followUser(input: FollowInput): Promise<ActionResult<{ followed: true }>> {
  const userId = await getCurrentUserId();
  const result = await presence.followUser(userId, input);
  if (result.ok) {
    revalidatePath('/dashboard');
    revalidatePath('/calendar');
    revalidatePath('/settings');
  }
  return result;
}

export async function unfollowUser(
  input: FollowInput,
): Promise<ActionResult<{ unfollowed: true }>> {
  const userId = await getCurrentUserId();
  const result = await presence.unfollowUser(userId, input);
  if (result.ok) {
    revalidatePath('/dashboard');
    revalidatePath('/calendar');
    revalidatePath('/settings');
  }
  return result;
}
