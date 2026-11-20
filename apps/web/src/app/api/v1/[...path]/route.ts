import { apiUrl } from '@/lib/api-config';
import { AVATAR_MAX_BYTES } from '@acme/contracts';
import { readBodyWithLimit, MAX_PROXY_BODY_BYTES } from '@/lib/body-limit';

export const dynamic = 'force-dynamic';

const UPSTREAM_TIMEOUT_MS = 20_000;

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

const errorResponse = (status: number, code: string, message: string): Response =>
  Response.json(
    {
      success: false,
      error: { code, message, requestId: 'proxy', timestamp: new Date().toISOString() },
    },
    { status },
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

  const isAvatarUpload = request.method === 'PUT' && path.at(-1) === 'avatar';
  const limit = isAvatarUpload ? AVATAR_MAX_BYTES : MAX_PROXY_BODY_BYTES;
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await readBodyWithLimit(request, limit) : undefined;
  if (body?.kind === 'too-large') {
    return errorResponse(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large');
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: body?.bytes ?? null,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const responseHeaders = new Headers(upstream.headers);
    STRIPPED_RESPONSE_HEADERS.forEach((name) => responseHeaders.delete(name));
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return errorResponse(503, 'SERVICE_UNAVAILABLE', 'The API is unavailable');
  }
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
