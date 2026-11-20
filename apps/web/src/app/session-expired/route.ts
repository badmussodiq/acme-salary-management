export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'acme_session';

export const GET = (): Response => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return new Response(null, {
    status: 307,
    headers: {
      Location: '/login',
      'Cache-Control': 'no-store',
      'Set-Cookie': `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${secure}`,
    },
  });
};
