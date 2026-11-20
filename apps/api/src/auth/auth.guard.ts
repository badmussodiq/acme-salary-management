import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../common/app.exception';
import { IS_PUBLIC_KEY, type AuthenticatedRequest } from './auth.decorators';
import { SESSION_COOKIE } from './auth.constants';
import { readCookie } from './session-cookie';
import { TokenService } from './token.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    const claims = token ? await this.tokens.verify(token) : undefined;
    const user = claims ? await this.users.findById(claims.userId) : undefined;

    if (!claims || !user || user.status !== 'active' || user.session_version !== claims.version) {
      throw new AppException('UNAUTHENTICATED', 'Authentication required');
    }
    request.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
