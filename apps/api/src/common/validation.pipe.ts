import { ValidationError, ValidationPipe } from '@nestjs/common';
import type { FieldError } from '@acme/contracts';
import { AppException } from './app.exception';

const flatten = (errors: readonly ValidationError[], parent = ''): FieldError[] =>
  errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flatten(error.children ?? [], field)];
  });

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    exceptionFactory: (errors) =>
      new AppException('VALIDATION_FAILED', 'Request validation failed', flatten(errors)),
  });
