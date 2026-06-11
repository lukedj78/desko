import { NextResponse } from 'next/server';

import { getMyProfile, getMyWeeklyPattern } from '@desko/queries/presence';

import { errorResponse } from '../_lib/respond';

/**
 * GET /api/settings — payload della tab Impostazioni del mobile:
 * profilo (anagrafica + visibilità) e pattern settimanale.
 */
export async function GET() {
  try {
    const [profile, pattern] = await Promise.all([getMyProfile(), getMyWeeklyPattern()]);
    return NextResponse.json({ profile, pattern });
  } catch (e) {
    return errorResponse(e);
  }
}
