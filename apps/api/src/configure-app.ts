import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { noStoreMiddleware } from './common/no-store';
import { requestIdMiddleware } from './common/request-id';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';
import { createValidationPipe } from './common/validation.pipe';
import type { AppConfig } from './config/app-config';

export const API_PREFIX = 'api/v1';

const FORBIDDEN_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

export const rejectForbiddenKeys = (key: string, value: unknown): unknown => {
  if (FORBIDDEN_KEYS.has(key)) throw new Error(`The key "${key}" is not allowed`);
  return value;
};

export const SERVER_TIMEOUTS = {
  headersTimeoutMs: 15_000,
  requestTimeoutMs: 30_000,
  keepAliveTimeoutMs: 5_000,
} as const;

const applyServerTimeouts = (app: NestExpressApplication): void => {
  const server = app.getHttpAdapter().getHttpServer();
  server.headersTimeout = SERVER_TIMEOUTS.headersTimeoutMs;
  server.requestTimeout = SERVER_TIMEOUTS.requestTimeoutMs;
  server.keepAliveTimeout = SERVER_TIMEOUTS.keepAliveTimeoutMs;
};

export const configureApp = (app: NestExpressApplication, config: AppConfig): void => {
  app.set('trust proxy', config.trustProxyHops);
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(noStoreMiddleware);
  app.useBodyParser('json', { limit: config.bodyLimit, reviver: rejectForbiddenKeys });
  app.enableCors({ origin: config.webOrigin, credentials: true });
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.enableShutdownHooks();
  applyServerTimeouts(app);
};
