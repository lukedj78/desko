import { getCurrentUserId } from '@desko/auth/server';
import * as lunch from '@desko/services/lunch';

/**
 * Read-side "lunch" — ADAPTER per RSC e route API.
 * Logica e visibilità (private = creator+invitati+partecipanti) in
 * `@desko/services/lunch`. Firme invariate per i consumer.
 */

export type {
  Cuisine,
  PriceRange,
  ProposalParticipant,
  ProposalStatus,
  ProposalSummary,
  ProposalVisibility,
  RestaurantWithRating,
} from '@desko/services/lunch';

export async function getRestaurants() {
  return lunch.getRestaurants();
}

export async function getLunchProposalsForDate(date?: string) {
  return lunch.getLunchProposalsForDate(await getCurrentUserId(), date);
}

export async function getMyLunchProposals() {
  return lunch.getMyLunchProposals(await getCurrentUserId());
}
