import type { NextRequest } from 'next/server';

import { getCurrentUserId } from '@desko/auth/server';
import { registerPushToken } from '@desko/services/push';

import { actionResponse, errorResponse } from '../../_lib/respond';

/**
 * POST /api/push/register — registra il push token Expo del device.
 * Body: { token: 'ExponentPushToken[...]', platform: 'ios'|'android' }
 * Trasporto mobile-only: nessun adapter server-action, il route handler
 * risolve la sessione e delega al servizio.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    return actionResponse(await registerPushToken(userId, body));
  } catch (e) {
    return errorResponse(e);
  }
}
