import { describe, expect, it } from 'vitest';
import { loadAppConfig } from './app-config';

describe('loadAppConfig', () => {
  it('applies development defaults when nothing is set', () => {
    const config = loadAppConfig({});

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3001);
    expect(config.throttleLimit).toBe(100);
  });

  it('coerces numeric strings', () => {
    expect(loadAppConfig({ PORT: '8080', THROTTLE_LIMIT: '5' })).toMatchObject({
      port: 8080,
      throttleLimit: 5,
    });
  });

  it.each([
    { PORT: '70000' },
    { PORT: 'abc' },
    { NODE_ENV: 'staging' },
    { DATABASE_URL: 'mysql://x' },
    { WEB_ORIGIN: 'localhost:3000' },
    { BODY_LIMIT: '100 gigabytes' },
    { JWT_SECRET: 'short' },
    { INITIAL_HR_EMAIL: 'not-an-email' },
  ])('rejects invalid values %o', (env) => {
    expect(() => loadAppConfig(env)).toThrow('Invalid environment configuration');
  });

  it('seeds a development HR user only outside production', () => {
    expect(loadAppConfig({}).initialHr?.email).toBe('hr@acme.test');
    expect(
      loadAppConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://u:p@db:5432/x',
        WEB_ORIGIN: 'https://hr.example.com',
        JWT_SECRET: 'x'.repeat(40),
      }).initialHr,
    ).toBeUndefined();
  });

  it('normalises the configured HR email', () => {
    const config = loadAppConfig({
      INITIAL_HR_EMAIL: 'Boss@Example.com',
      INITIAL_HR_PASSWORD: 'a-long-enough-password',
    });

    expect(config.initialHr).toEqual({
      email: 'boss@example.com',
      password: 'a-long-enough-password',
    });
  });

  it('requires explicit connection settings in production', () => {
    expect(() => loadAppConfig({ NODE_ENV: 'production' })).toThrow(
      'Missing required environment variables: DATABASE_URL, WEB_ORIGIN, JWT_SECRET',
    );
  });
});
