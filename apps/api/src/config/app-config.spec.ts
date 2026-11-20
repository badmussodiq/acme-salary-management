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
  ])('rejects invalid values %o', (env) => {
    expect(() => loadAppConfig(env)).toThrow('Invalid environment configuration');
  });

  it('requires explicit connection settings in production', () => {
    expect(() => loadAppConfig({ NODE_ENV: 'production' })).toThrow(
      'Missing required environment variables: DATABASE_URL, WEB_ORIGIN',
    );
  });
});
