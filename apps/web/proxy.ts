import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/lib/auth';

/**
 * Proxy Next.js 16 — gate di accesso con session validation reale.
 *
 * Pattern raccomandato dalle doc better-auth (Next 15.2+):
 *
 *   const session = await auth.api.getSession({ headers: request.headers });
 *
 * Questo:
 *   - Verifica firma + scadenza del cookie better-auth
 *   - Valida la session contro il DB (revoca, ban utente, expired session)
 *   - Mitigato dal `cookieCache: { enabled: true, maxAge: 5min }` settato in
 *     lib/auth.ts → niente hit DB ad ogni request, il cookie porta con sé
 *     una versione cached della session
 *
 * Runtime nodejs (richiesto perché `auth` importa Drizzle + Neon):
 * dichiarato via `export const config = { runtime: 'nodejs' }`. È il pattern
 * default in Next 16 (l'edge runtime su middleware/proxy è opt-in).
 */

const PUBLIC_AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

const FULLY_PUBLIC_PREFIXES = ['/showcase', '/api/auth', '/_next', '/favicon'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip per asset, api auth, showcase
  if (FULLY_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Validation reale della session (DB lookup mitigato da cookieCache)
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;
  const isAuthenticated = !!user;

  // Auth pages: se loggato → dashboard
  if (PUBLIC_AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Home pubblica
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Resto richiede auth
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes: gate "elevato" (admin + hr_analytics).
  // Le singole route sotto /admin restringono ulteriormente quando serve
  // (es. /admin/users richiede admin puro — gate server-side nella page).
  if (pathname.startsWith('/admin')) {
    const role = (user as { role?: string }).role;
    if (role !== 'admin' && role !== 'hr_analytics') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Next 16: il Proxy gira sempre su Node.js — non serve (e non è ammesso)
// dichiarare `runtime`. Solo `matcher` è ancora consentito.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
