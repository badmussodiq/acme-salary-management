import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { SessionUser } from '@acme/contracts';
import { AppException } from '../common/app.exception';
import { Roles } from './auth.decorators';
import { RolesGuard } from './roles.guard';

class Restricted {
  @Roles('hr_manager')
  handle(): void {}

  open(): void {}
}

const contextFor = (handler: () => void, user?: SessionUser): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => Restricted,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const hr: SessionUser = { id: '1', email: 'hr@example.com', role: 'hr_manager' };
const guard = new RolesGuard(new Reflector());
const restricted = new Restricted();

describe('RolesGuard', () => {
  it('allows a user holding the required role', () => {
    expect(guard.canActivate(contextFor(restricted.handle, hr))).toBe(true);
  });

  it('answers FORBIDDEN when a user lacks the role', () => {
    const outsider = { ...hr, role: 'auditor' } as unknown as SessionUser;

    expect(() => guard.canActivate(contextFor(restricted.handle, outsider))).toThrow(AppException);
  });

  it('answers FORBIDDEN when no user is attached', () => {
    expect(() => guard.canActivate(contextFor(restricted.handle))).toThrow(
      'You do not have permission',
    );
  });

  it('does not restrict handlers without role metadata', () => {
    expect(guard.canActivate(contextFor(restricted.open))).toBe(true);
  });
});
