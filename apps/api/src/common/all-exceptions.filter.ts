import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  errorCodeForStatus,
  type ApiErrorResponse,
  type ErrorCode,
  type FieldError,
} from '@acme/contracts';
import { AppException } from './app.exception';
import { readRequestId } from './request-id';

interface ResolvedError {
  readonly status: number;
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: readonly FieldError[];
}

const INTERNAL_MESSAGE = 'An unexpected error occurred';

const clientStatusOf = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  const { status } = error;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
};

const messageOf = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : 'Request could not be processed';

const resolve = (exception: unknown): ResolvedError => {
  if (exception instanceof AppException) {
    return {
      status: exception.getStatus(),
      code: exception.code,
      message: exception.message,
      ...(exception.details ? { details: exception.details } : {}),
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return {
      status,
      code: errorCodeForStatus(status),
      message: status >= 500 ? INTERNAL_MESSAGE : exception.message,
    };
  }
  const clientStatus = clientStatusOf(exception);
  if (clientStatus !== undefined) {
    return {
      status: clientStatus,
      code: errorCodeForStatus(clientStatus),
      message: messageOf(exception),
    };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: INTERNAL_MESSAGE };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const resolved = resolve(exception);
    const requestId = readRequestId(request);

    if (resolved.status >= 500) {
      this.logger.error(
        `${request.method} ${request.path} ${requestId}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: resolved.code,
        message: resolved.message,
        ...(resolved.details ? { details: resolved.details } : {}),
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    response.status(resolved.status).json(body);
  }
}
