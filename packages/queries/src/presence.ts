import { getCurrentUserId } from '@desko/auth/server';
import * as presence from '@desko/services/presence';
import { resolveViewer, type Viewer } from '@desko/services/presence';

/**
 * Read-side "presence" — ADAPTER per RSC e route API.
 *
 * La logica (SQL, filtro privacy US-5) vive in `@desko/services/presence`.
 * Qui solo: risoluzione del viewer dalla sessione Next + delega.
 * Le firme esportate restano invariate per i consumer (pagine RSC, /api).
 */

export type {
  FloorOccupancy,
  MonthAttendee,
  MonthDayPresence,
  MyProfile,
  PresenceEntry,
  WeeklyPattern,
} from '@desko/services/presence';

/** Viewer corrente (id + team) o null se non autenticato. */
async function getViewer(): Promise<Viewer | null> {
  try {
    const id = await getCurrentUserId();
    return await resolveViewer(id);
  } catch {
    return null;
  }
}

export async function getPresencesForDate(date?: string) {
  return presence.getPresencesForDate(await getViewer(), date);
}

export async function getTodayCounts() {
  return presence.getTodayCounts();
}

export async function getFloorOccupancy() {
  return presence.getFloorOccupancy(await getViewer());
}

export async function getMyPresenceToday() {
  return presence.getPresenceToday(await getCurrentUserId());
}

export async function getMyWeeklyPattern() {
  return presence.getWeeklyPattern(await getCurrentUserId());
}

export async function getMyProfile() {
  return presence.getProfile(await getCurrentUserId());
}

export async function getFollowedColleaguesWeek(isoWeekStart: string) {
  const viewer = await resolveViewer(await getCurrentUserId());
  return presence.getFollowedColleaguesWeek(viewer, isoWeekStart);
}

export async function getUpcomingOfficeEvents() {
  return presence.getUpcomingOfficeEvents();
}

export async function getMyFollows() {
  return presence.getFollows(await getCurrentUserId());
}

export async function searchUsers(query: string, limit = 20) {
  return presence.searchUsers(await getCurrentUserId(), query, limit);
}

export async function getPresencesForRange(fromDate: string, toDate: string) {
  return presence.getPresencesForRange(await getViewer(), fromDate, toDate);
}

export async function getMyMonthCounts() {
  return presence.getMonthCounts(await getCurrentUserId());
}
