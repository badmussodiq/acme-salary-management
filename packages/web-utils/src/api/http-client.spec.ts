import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpRequestError, httpRequest, httpRequestWithMeta } from './http-client';

const respond = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const stubFetch = (response: Response | Error) => {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('httpRequest', () => {
  it('unwraps the success envelope', async () => {
    stubFetch(respond(200, { success: true, data: { id: 1 } }));

    await expect(httpRequest<{ id: number }>({ url: '/x' })).resolves.toEqual({ id: 1 });
  });

  it('returns pagination meta', async () => {
    stubFetch(respond(200, { success: true, data: [1], meta: { page: 1, limit: 10, total: 1 } }));

    const result = await httpRequestWithMeta<number[]>({ url: '/x' });

    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
  });

  it('sends JSON bodies with the method and content type', async () => {
    const fetchMock = stubFetch(respond(200, { success: true, data: null }));

    await httpRequest({ url: '/x', method: 'POST', body: { a: 1 } });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init).toMatchObject({
      method: 'POST',
      body: '{"a":1}',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('throws a typed error carrying code, details and request id', async () => {
    stubFetch(
      respond(400, {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'bad',
          details: [{ field: 'name', message: 'required' }],
          requestId: 'r1',
          timestamp: 't',
        },
      }),
    );

    const error = await httpRequest({ url: '/x' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpRequestError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      requestId: 'r1',
      details: [{ field: 'name', message: 'required' }],
    });
  });

  it('maps non-envelope failures to UNKNOWN', async () => {
    stubFetch(new Response('<html>', { status: 502, statusText: 'Bad Gateway' }));

    await expect(httpRequest({ url: '/x' })).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN',
    });
  });

  it('maps transport failures to NETWORK_ERROR', async () => {
    stubFetch(new Error('offline'));

    await expect(httpRequest({ url: '/x' })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
