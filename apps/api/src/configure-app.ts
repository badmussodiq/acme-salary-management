import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { requestIdMiddleware } from './common/request-id';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';
import { createValidationPipe } from './common/validation.pipe';
import type { AppConfig } from './config/app-config';

export const API_PREFIX = 'api/v1';

export const configureApp = (app: NestExpressApplication, config: AppConfig): void => {
  app.set('trust proxy', config.trustProxyHops);
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.useBodyParser('json', { limit: config.bodyLimit });
  app.useBodyParser('urlencoded', { limit: config.bodyLimit, extended: false });
  app.enableCors({ origin: config.webOrigin, credentials: true });
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.enableShutdownHooks();
};
