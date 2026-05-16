import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@desko/auth';

/**
 * Catch-all route per better-auth handler.
 * Espone tutti gli endpoint REST: /api/auth/sign-in, /api/auth/sign-up,
 * /api/auth/sign-out, /api/auth/callback/microsoft, ecc.
 */
export const { GET, POST } = toNextJsHandler(auth.handler);
