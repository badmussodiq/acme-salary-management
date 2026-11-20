import { HttpException } from '@nestjs/common';
import { HTTP_STATUS_BY_ERROR_CODE, type ErrorCode, type FieldError } from '@acme/contracts';

export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly details: readonly FieldError[] | undefined;

  constructor(code: ErrorCode, message: string, details?: readonly FieldError[]) {
    super(message, HTTP_STATUS_BY_ERROR_CODE[code]);
    this.code = code;
    this.details = details;
  }
}
