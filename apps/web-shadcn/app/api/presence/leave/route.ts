import { leaveOffice } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/** POST /api/presence/leave — esci dall'ufficio per oggi (status → remote). */
export async function POST() {
  try {
    return actionResponse(await leaveOffice());
  } catch (e) {
    return errorResponse(e);
  }
}
