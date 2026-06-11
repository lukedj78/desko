import { NextResponse } from 'next/server';

import { getRestaurants } from '@desko/queries/lunch';

import { errorResponse } from '../../_lib/respond';

/** GET /api/lunch/restaurants — ristoranti attivi con rating aggregato. */
export async function GET() {
  try {
    const restaurants = await getRestaurants();
    return NextResponse.json({ restaurants });
  } catch (e) {
    return errorResponse(e);
  }
}
