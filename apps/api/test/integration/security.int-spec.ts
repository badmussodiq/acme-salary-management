import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SERVER_TIMEOUTS } from '../../src/configure-app';
import { employeePayload } from './fixtures';
import {
  createUser,
  hrCredentials,
  randomIp,
  startIntegrationApp,
  type IntegrationApp,
} from './harness';

let context: IntegrationApp;
const credentials = hrCredentials();

beforeAll(async () => {
  context = await startIntegrationApp();
});

afterAll(async () => {
  await context.close();
});

const loginResponse = (email: string, password: string) =>
  context.anonymous().post('/api/v1/auth/login').send({ email, password });

const sessionCookie = async (email = credentials.email, password = credentials.password) => {
  const response = await loginResponse(email, password);
  const header = response.headers['set-cookie']?.[0] ?? '';
  return header.split(';')[0] ?? '';
};

describe('session revocation', () => {
  it('invalidates the token when the user signs out', async () => {
    const cookie = await sessionCookie();
    const before = await context.anonymous().get('/api/v1/auth/me').set('Cookie', cookie);

    await context.anonymous().post('/api/v1/auth/logout').set('Cookie', cookie).expect(200);
    const after = await context.anonymous().get('/api/v1/auth/me').set('Cookie', cookie);

    expect(before.status).toBe(200);
    expect(after.status).toBe(401);
  });

  it('signs the user out everywhere, not just on the device that asked', async () => {
    const first = await sessionCookie();
    const second = await sessionCookie();

    await context.anonymous().post('/api/v1/auth/logout').set('Cookie', first);

    const other = await context.anonymous().get('/api/v1/auth/me').set('Cookie', second);
    expect(other.status).toBe(401);
  });

  it('allows signing in again after a sign-out', async () => {
    const cookie = await sessionCookie();
    await context.anonymous().post('/api/v1/auth/logout').set('Cookie', cookie);

    const fresh = await sessionCookie();

    const me = await context.anonymous().get('/api/v1/auth/me').set('Cookie', fresh);
    expect(me.status).toBe(200);
  });

  it('treats a sign-out without a valid session as a harmless no-op', async () => {
    const response = await context.anonymous().post('/api/v1/auth/logout');

    expect(response.status).toBe(200);
  });

  it('marks the session cookie Secure when configured for production', async () => {
    const secure = await startIntegrationApp({ cookieSecure: true });
    try {
      const { initialHr } = secure.config;
      const response = await secure
        .anonymous()
        .post('/api/v1/auth/login')
        .send({ email: initialHr?.email, password: initialHr?.password });

      expect(response.headers['set-cookie']?.[0]).toMatch(/Secure/);
      expect(response.headers['set-cookie']?.[0]).toMatch(/HttpOnly/);
    } finally {
      await secure.close();
    }
  });
});

describe('rate limits follow the signed-in user, not just the address', () => {
  it('limits one user without blocking another behind the same address', async () => {
    await createUser(context, 'second.hr@example.com', 'another-long-password-1');
    const sharedIp = randomIp();
    const first: TestAgent = (await context.loginAgent()).set('X-Forwarded-For', sharedIp);
    const second: TestAgent = (
      await context.loginAgent('second.hr@example.com', 'another-long-password-1')
    ).set('X-Forwarded-For', sharedIp);

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 32; attempt += 1) {
      statuses.push((await first.post('/api/v1/employees').send({})).status);
    }
    const otherUser = await second.post('/api/v1/employees').send({});

    expect(statuses.slice(0, 30).every((status) => status === 400)).toBe(true);
    expect(statuses.slice(30)).toEqual([429, 429]);
    expect(otherUser.status).toBe(400);
  });
});

describe('hostile and malformed requests', () => {
  const tester = { email: 'hostile.tester@example.com', password: 'a-tester-long-password-1' };

  beforeAll(async () => {
    await createUser(context, tester.email, tester.password);
  });

  const post = async (body: string, contentType: string) => {
    const agent = await context.loginAgent(tester.email, tester.password);
    return agent.post('/api/v1/employees').set('Content-Type', contentType).send(body);
  };

  it('rejects a prototype-pollution payload', async () => {
    const payload = `{"__proto__":{"isAdmin":true},"constructor":{"prototype":{"x":1}},${JSON.stringify(employeePayload()).slice(1)}`;

    const response = await post(payload, 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(({} as { isAdmin?: boolean }).isAdmin).toBeUndefined();
  });

  it('answers malformed JSON with the standard envelope', async () => {
    const response = await post('{"firstName": ', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it.each([
    ['form-encoded', 'application/x-www-form-urlencoded', 'firstName=Ada&lastName=Lovelace'],
    ['plain text', 'text/plain', JSON.stringify(employeePayload())],
  ])('does not accept a %s body as JSON', async (_label, contentType, body) => {
    const response = await post(body, contentType);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects a body larger than the limit with 413', async () => {
    const response = await post(JSON.stringify({ blob: 'x'.repeat(200_000) }), 'application/json');

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('does not echo the submitted values back in error details', async () => {
    const agent = await context.loginAgent(tester.email, tester.password);

    const response = await agent
      .post('/api/v1/employees')
      .send({ ...employeePayload(), email: '<script>alert(1)</script>' });

    expect(JSON.stringify(response.body)).not.toContain('<script>');
  });

  it('does not expose server internals on unexpected paths', async () => {
    const response = await context.anonymous().get('/api/v1/../../etc/passwd');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toMatch(/node_modules|at \w+ \(/);
  });
});

describe('browser protections', () => {
  it('does not grant cross-origin access to a foreign origin', async () => {
    const response = await request(context.app.getHttpServer())
      .options('/api/v1/employees')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });

  it('allows the configured web origin only', async () => {
    const response = await request(context.app.getHttpServer())
      .options('/api/v1/employees')
      .set('Origin', context.config.webOrigin)
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).toBe(context.config.webOrigin);
  });

  it('sets defensive headers on API responses', async () => {
    const response = await context.anonymous().get('/api/v1/health/live');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });
});

describe('slow-client protection', () => {
  it('applies header and request timeouts to the HTTP server', () => {
    const server = context.app.getHttpServer();

    expect(server.headersTimeout).toBe(SERVER_TIMEOUTS.headersTimeoutMs);
    expect(server.requestTimeout).toBe(SERVER_TIMEOUTS.requestTimeoutMs);
  });
});

describe('every business route demands a session', () => {
  const ID = '00000000-0000-4000-8000-000000000000';
  const routes: readonly (readonly [string, string])[] = [
    ['GET', '/api/v1/auth/me'],
    ['GET', '/api/v1/employees'],
    ['GET', '/api/v1/employees/facets'],
    ['POST', '/api/v1/employees'],
    ['GET', `/api/v1/employees/${ID}`],
    ['PATCH', `/api/v1/employees/${ID}`],
    ['GET', `/api/v1/employees/${ID}/compensation`],
    ['POST', `/api/v1/employees/${ID}/compensation`],
    ['GET', `/api/v1/employees/${ID}/audit`],
    ['GET', '/api/v1/insights/overview'],
    ['GET', '/api/v1/insights/salary-distribution'],
    ['GET', '/api/v1/insights/data-quality'],
  ];

  it.each(routes)('%s %s answers 401 without a session', async (method, path) => {
    const agent = context.anonymous();
    const response = await (method === 'GET'
      ? agent.get(path)
      : method === 'POST'
        ? agent.post(path).send({})
        : agent.patch(path).send({}));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});
