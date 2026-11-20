import { NextResponse, type NextRequest } from 'next/server';
import { buildContentSecurityPolicy, createNonce } from '@/lib/csp';

const SESSION_COOKIE = 'acme_session';

export const proxy = (request: NextRequest): NextResponse => {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLogin = request.nextUrl.pathname === '/login';

  if (!hasSession && !isLogin) return NextResponse.redirect(new URL('/login', request.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL('/dashboard', request.url));

  const policy = buildContentSecurityPolicy({
    nonce: createNonce(),
    development: process.env.NODE_ENV !== 'production',
  });
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', policy);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
};

export const config = { matcher: ['/((?!api/|healthz|session-expired|_next/|favicon.ico).*)'] };
