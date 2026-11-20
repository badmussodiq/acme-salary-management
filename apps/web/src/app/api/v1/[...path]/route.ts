import { apiUrl } from '@/lib/api-config';

export const dynamic = 'force-dynamic';

const STRIPPED_REQUEST_HEADERS: ReadonlySet<string> = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const STRIPPED_RESPONSE_HEADERS = ['content-encoding', 'content-length', 'transfer-encoding'];

const unavailable = (): Response =>
  Response.json(
    {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The API is unavailable',
        requestId: 'proxy',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 503 },
  );

const forward = async (
  request: Request,
  context: { readonly params: Promise<{ readonly path: readonly string[] }> },
): Promise<Response> => {
  const { path } = await context.params;
  const target = `${apiUrl(`/${path.join('/')}`)}${new URL(request.url).search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key)) headers.set(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : null,
      redirect: 'manual',
      cache: 'no-store',
    });
    const responseHeaders = new Headers(upstream.headers);
    STRIPPED_RESPONSE_HEADERS.forEach((name) => responseHeaders.delete(name));
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return unavailable();
  }
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
