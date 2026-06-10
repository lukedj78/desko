import { NextResponse } from 'next/server';

import {
  getMyPresenceToday,
  getPresencesForDate,
  getTodayCounts,
} from '@desko/queries/presence';

import { errorResponse } from '../../_lib/respond';

/**
 * GET /api/presence/today — payload della tab "Oggi" del mobile.
 * Le query applicano già il filtro privacy `presenceVisibility` (US-5)
 * rispetto all'utente della sessione.
 */
export async function GET() {
  try {
    const [me, counts, entries] = await Promise.all([
      getMyPresenceToday(),
      getTodayCounts(),
      getPresencesForDate(),
    ]);
    return NextResponse.json({ me, counts, entries });
  } catch (e) {
    return errorResponse(e);
  }
}
