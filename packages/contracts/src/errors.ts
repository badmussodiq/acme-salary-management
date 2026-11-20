export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface FieldError {
  readonly field: string;
  readonly message: string;
}

export interface ApiErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: readonly FieldError[];
  readonly requestId: string;
  readonly timestamp: string;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorBody;
}

export const HTTP_STATUS_BY_ERROR_CODE: Readonly<Record<ErrorCode, number>> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const errorCodeForStatus = (status: number): ErrorCode => {
  const match = ERROR_CODES.find((code) => HTTP_STATUS_BY_ERROR_CODE[code] === status);
  if (match) return match;
  return status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_FAILED';
};

export const isErrorCode = (value: unknown): value is ErrorCode =>
  ERROR_CODES.some((code) => code === value);

export const isApiErrorResponse = (value: unknown): value is ApiErrorResponse =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  value.success === false &&
  'error' in value &&
  typeof value.error === 'object' &&
  value.error !== null &&
  'code' in value.error &&
  isErrorCode(value.error.code) &&
  'message' in value.error &&
  typeof value.error.message === 'string';
