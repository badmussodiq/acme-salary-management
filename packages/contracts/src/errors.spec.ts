import { describe, expect, it } from 'vitest';
import {
  ERROR_CODES,
  HTTP_STATUS_BY_ERROR_CODE,
  errorCodeForStatus,
  isApiErrorResponse,
} from './errors';

describe('errorCodeForStatus', () => {
  it.each(ERROR_CODES)('maps the status of %s back to the same code', (code) => {
    expect(errorCodeForStatus(HTTP_STATUS_BY_ERROR_CODE[code])).toBe(code);
  });

  it('maps unmapped server statuses to INTERNAL_ERROR', () => {
    expect(errorCodeForStatus(502)).toBe('INTERNAL_ERROR');
  });

  it('maps unknown client statuses to VALIDATION_FAILED', () => {
    expect(errorCodeForStatus(422)).toBe('VALIDATION_FAILED');
  });
});

describe('isApiErrorResponse', () => {
  const valid = {
    success: false,
    error: { code: 'FORBIDDEN', message: 'no', requestId: 'r', timestamp: 't' },
  };

  it('accepts a well-formed error response', () => {
    expect(isApiErrorResponse(valid)).toBe(true);
  });

  it('rejects unknown codes, success bodies and non-objects', () => {
    expect(isApiErrorResponse({ ...valid, error: { ...valid.error, code: 'X' } })).toBe(false);
    expect(isApiErrorResponse({ success: true, data: 1 })).toBe(false);
    expect(isApiErrorResponse(null)).toBe(false);
    expect(isApiErrorResponse('error')).toBe(false);
  });
});
