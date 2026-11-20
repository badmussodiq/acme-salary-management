import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from './api-config';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiUrl', () => {
  it('falls back to the local API', () => {
    vi.stubEnv('API_URL', undefined);

    expect(apiUrl('/health/live')).toBe('http://localhost:3001/api/v1/health/live');
  });

  it('uses the configured API origin', () => {
    vi.stubEnv('API_URL', 'https://api.example.com/api/v1');

    expect(apiUrl('/health/ready')).toBe('https://api.example.com/api/v1/health/ready');
  });
});
