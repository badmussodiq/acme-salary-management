import { Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerStorage,
  getOptionsToken,
  getStorageToken,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { SESSION_COOKIE } from './auth.constants';
import { readCookie } from './session-cookie';
import { TokenService } from './token.service';

const cookieHeaderOf = (request: Record<string, unknown>): string | undefined => {
  const { headers } = request;
  if (typeof headers !== 'object' || headers === null || !('cookie' in headers)) return undefined;
  return typeof headers.cookie === 'string' ? headers.cookie : undefined;
};

@Injectable()
export class SessionAwareThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly tokens: TokenService,
  ) {
    super(options, storageService, reflector);
  }

  protected override async getTracker(request: Record<string, unknown>): Promise<string> {
    const token = readCookie(cookieHeaderOf(request), SESSION_COOKIE);
    const claims = token ? await this.tokens.verify(token) : undefined;
    if (claims) return `user:${claims.userId}`;
    return typeof request['ip'] === 'string' ? request['ip'] : 'unknown';
  }
}
