import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionUser, UserRole } from '@acme/contracts';
import { AppException } from '../common/app.exception';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: readonly UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!user) throw new AppException('UNAUTHENTICATED', 'Authentication required');
  return user;
});
