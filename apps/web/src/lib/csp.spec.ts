import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, createNonce } from './csp';

describe('buildContentSecurityPolicy', () => {
  const policy = buildContentSecurityPolicy({ nonce: 'abc123', development: false });

  it('allows scripts only from this origin or carrying the nonce', () => {
    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain('unsafe-eval');
  });

  it('blocks plugins, framing and foreign form targets', () => {
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("base-uri 'self'");
  });

  it('limits network calls to this origin', () => {
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("default-src 'self'");
  });

  it('only allows eval in development for hot reloading', () => {
    expect(buildContentSecurityPolicy({ nonce: 'n', development: true })).toContain(
      "'unsafe-eval'",
    );
  });
});

describe('createNonce', () => {
  it('is unpredictable and safe to place in a header', () => {
    const first = createNonce();

    expect(first).not.toBe(createNonce());
    expect(first).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
