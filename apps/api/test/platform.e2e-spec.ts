import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { isApiErrorResponse } from '@acme/contracts';
import { createTestApp, type FakeDatabase } from './create-test-app';

let app: NestExpressApplication | undefined;

const start = async (
  overrides: Parameters<typeof createTestApp>[0] = {},
  database?: FakeDatabase,
): Promise<NestExpressApplication> => {
  app = await createTestApp(overrides, database);
  return app;
};

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('health endpoints', () => {
  it('reports liveness in the success envelope', async () => {
    const response = await request((await start()).getHttpServer()).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('reports readiness when the database is reachable', async () => {
    const response = await request((await start()).getHttpServer()).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok', checks: { database: 'ok' } },
    });
  });

  it('returns 503 SERVICE_UNAVAILABLE when the database is down', async () => {
    const response = await request((await start({}, { reachable: false })).getHttpServer()).get(
      '/api/v1/health/ready',
    );

    expect(response.status).toBe(503);
    expect(isApiErrorResponse(response.body)).toBe(true);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

describe('error envelope', () => {
  it('maps unknown routes to NOT_FOUND with a request id', async () => {
    const response = await request((await start()).getHttpServer()).get('/api/v1/missing');

    expect(response.status).toBe(404);
    expect(isApiErrorResponse(response.body)).toBe(true);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('rejects oversized bodies with PAYLOAD_TOO_LARGE', async () => {
    const response = await request((await start({ bodyLimit: '1kb' })).getHttpServer())
      .post('/api/v1/health/live')
      .send({ blob: 'x'.repeat(5_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('rate limiting', () => {
  it('returns 429 RATE_LIMITED with Retry-After once the limit is exceeded', async () => {
    const server = (await start({ throttleLimit: 2 })).getHttpServer();

    await request(server).get('/api/v1/probe');
    await request(server).get('/api/v1/probe');
    const response = await request(server).get('/api/v1/probe');

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('never throttles health probes', async () => {
    const server = (await start({ throttleLimit: 1 })).getHttpServer();

    const statuses = await Promise.all(
      Array.from(
        { length: 5 },
        async () => (await request(server).get('/api/v1/health/live')).status,
      ),
    );

    expect(statuses).toEqual([200, 200, 200, 200, 200]);
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const response = await request((await start()).getHttpServer()).get('/api/v1/health/live');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
