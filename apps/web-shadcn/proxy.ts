import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@desko/auth';

/**
 * Proxy Next.js 16 — gate di accesso con session validation reale.
 * Pattern identico all'app MUI ma su porta 3020.
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

  if (FULLY_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;
  const isAuthenticated = !!user;

  if (PUBLIC_AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === '/') return NextResponse.next();

  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
