import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../common/app.exception';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigin: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.allowedOrigin = new URL(config.webOrigin).origin;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const origin = request.headers.origin;
    if (origin !== undefined && origin !== this.allowedOrigin) {
      throw new AppException('FORBIDDEN', 'Cross-origin request rejected');
    }
    return true;
  }
}
