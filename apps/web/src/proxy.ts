import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'acme_session';

export const proxy = (request: NextRequest): NextResponse => {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLogin = request.nextUrl.pathname === '/login';

  if (!hasSession && !isLogin) return NextResponse.redirect(new URL('/login', request.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL('/employees', request.url));
  return NextResponse.next();
};

export const config = { matcher: ['/((?!api/|healthz|_next/|favicon.ico).*)'] };
