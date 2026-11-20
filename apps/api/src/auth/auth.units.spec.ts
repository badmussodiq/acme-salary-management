import { describe, expect, it } from 'vitest';
import { loadAppConfig } from '../config/app-config';
import {
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGINS,
  afterFailedLogin,
  afterSuccessfulLogin,
  isLocked,
  type LockState,
} from './lockout';
import { hashPassword, verifyPassword } from './password';
import { readCookie } from './session-cookie';
import { TokenService } from './token.service';

const NOW = new Date('2026-01-01T10:00:00Z');
const CLEAN: LockState = { failedLoginCount: 0, lockedUntil: null };

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse battery');

    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('wrong password', stored)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it.each(['', 'plain', 'scrypt$1$2', 'bcrypt$1$2$3$a$b', 'scrypt$x$8$3$YQ==$YQ=='])(
    'treats malformed stored value %j as a mismatch',
    async (stored) => {
      expect(await verifyPassword('anything', stored)).toBe(false);
    },
  );
});

describe('lockout', () => {
  it('counts failures until the threshold then locks and resets the counter', () => {
    let state = CLEAN;
    for (let attempt = 1; attempt < MAX_FAILED_LOGINS; attempt += 1) {
      state = afterFailedLogin(state, NOW);
      expect(isLocked(state, NOW)).toBe(false);
    }

    state = afterFailedLogin(state, NOW);

    expect(state.failedLoginCount).toBe(0);
    expect(state.lockedUntil).toEqual(new Date(NOW.getTime() + LOCKOUT_MINUTES * 60_000));
    expect(isLocked(state, NOW)).toBe(true);
  });

  it('unlocks once the lock period has passed', () => {
    const state = { failedLoginCount: 0, lockedUntil: new Date(NOW.getTime() - 1) };

    expect(isLocked(state, NOW)).toBe(false);
  });

  it('clears everything on success', () => {
    expect(afterSuccessfulLogin()).toEqual(CLEAN);
  });
});

describe('readCookie', () => {
  it('finds a cookie among several', () => {
    expect(readCookie('a=1; acme_session=tok%20en; b=2', 'acme_session')).toBe('tok en');
  });

  it('returns undefined when absent or the header is missing', () => {
    expect(readCookie('a=1', 'acme_session')).toBeUndefined();
    expect(readCookie(undefined, 'acme_session')).toBeUndefined();
  });
});

describe('TokenService', () => {
  const service = new TokenService(loadAppConfig({}));

  it('round-trips the user id', async () => {
    expect(await service.verify(await service.issue('user-1'))).toBe('user-1');
  });

  it('rejects tampered and foreign tokens', async () => {
    const token = await service.issue('user-1');
    const other = new TokenService(loadAppConfig({ JWT_SECRET: 'z'.repeat(40) }));

    expect(await service.verify(`${token}x`)).toBeUndefined();
    expect(await other.verify(token)).toBeUndefined();
    expect(await service.verify('not-a-token')).toBeUndefined();
  });
});
