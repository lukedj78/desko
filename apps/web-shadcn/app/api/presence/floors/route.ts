import { NextResponse } from 'next/server';

import { getFloorOccupancy } from '@desko/queries/presence';

import { errorResponse } from '../../_lib/respond';

/**
 * GET /api/presence/floors — occupazione per piano (US-7) per la tab
 * Piani del mobile. Calcolata sulle presenze visibili al viewer
 * (filtro privacy applicato nella query condivisa).
 */
export async function GET() {
  try {
    const occupancy = await getFloorOccupancy();
    return NextResponse.json(occupancy);
  } catch (e) {
    return errorResponse(e);
  }
}
