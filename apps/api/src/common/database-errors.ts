const UNIQUE_VIOLATION = '23505';
const EXCLUSION_VIOLATION = '23P01';

interface PgError {
  readonly code: string;
  readonly constraint?: string;
}

const isPgError = (error: unknown): error is PgError =>
  typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string';

export const isUniqueViolation = (error: unknown, constraint?: string): boolean =>
  isPgError(error) &&
  error.code === UNIQUE_VIOLATION &&
  (constraint === undefined || error.constraint === constraint);

export const isExclusionViolation = (error: unknown): boolean =>
  isPgError(error) && error.code === EXCLUSION_VIOLATION;
