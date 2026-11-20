import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isApiErrorResponse } from '@acme/contracts';
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

const login = (email: string, password: string, ip = randomIp()) =>
  context
    .anonymous()
    .set('X-Forwarded-For', ip)
    .post('/api/v1/auth/login')
    .send({ email, password });

describe('POST /auth/login', () => {
  it('creates the initial HR manager from an empty database and signs in', async () => {
    const response = await login(credentials.email, credentials.password);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { id: expect.any(String), email: credentials.email, role: 'hr_manager' },
    });
    const cookie = response.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain('acme_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('gives the same generic 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await login(credentials.email, 'definitely-not-it');
    const unknownEmail = await login('nobody@example.com', 'definitely-not-it');

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
    expect(wrongPassword.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects malformed bodies with field-level validation errors', async () => {
    const response = await login('not-an-email', '');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('rate limits repeated attempts from one address with 429', async () => {
    const ip = randomIp();
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 7; attempt += 1) {
      statuses.push((await login('nobody@example.com', 'wrong-password', ip)).status);
    }

    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('locks the account after repeated failures even for the right password', async () => {
    await createUser(context, 'locked@example.com', 'a-correct-password-1');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login('locked@example.com', 'wrong-password');
    }

    const response = await login('locked@example.com', 'a-correct-password-1');

    expect(response.status).toBe(401);
  });
});

describe('session handling', () => {
  it('rejects protected routes without a session using the standard envelope', async () => {
    const response = await context.anonymous().get('/api/v1/employees');

    expect(response.status).toBe(401);
    expect(isApiErrorResponse(response.body)).toBe(true);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a tampered session cookie', async () => {
    const response = await context
      .anonymous()
      .get('/api/v1/auth/me')
      .set('Cookie', 'acme_session=not.a.valid.token');

    expect(response.status).toBe(401);
  });

  it('returns the signed-in user and then nothing after logout', async () => {
    const agent = await context.loginAgent();

    const me = await agent.get('/api/v1/auth/me');
    expect(me.body.data.email).toBe(credentials.email);

    await agent.post('/api/v1/auth/logout').expect(200);
    const afterLogout = await agent.get('/api/v1/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  it('rejects state-changing requests from a foreign origin with 403', async () => {
    const agent = await context.loginAgent();

    const response = await agent
      .post('/api/v1/auth/logout')
      .set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
