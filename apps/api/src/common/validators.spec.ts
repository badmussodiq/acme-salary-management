import { describe, expect, it } from 'vitest';
import { escapeLike } from './sql-like';
import { isCalendarDate, isPositiveMoney } from './validators';

describe('isCalendarDate', () => {
  it.each(['2026-02-28', '2024-02-29', '1999-12-31'])('accepts %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each([
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '26-01-01',
    '2026-1-1',
    '',
    20260101,
    null,
    '1800-01-01',
  ])('rejects %s', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});

describe('isPositiveMoney', () => {
  it.each(['1', '85000', '85000.5', '85000.55', '0.01'])('accepts %s', (value) => {
    expect(isPositiveMoney(value)).toBe(true);
  });

  it.each([
    '0',
    '0.00',
    '-5',
    '1.234',
    '1e5',
    'abc',
    '',
    ' 5',
    '1,000',
    5000,
    null,
    '9999999999999',
  ])('rejects %s', (value) => {
    expect(isPositiveMoney(value)).toBe(false);
  });
});

describe('escapeLike', () => {
  it('escapes wildcard characters so user input is matched literally', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeLike("O'Brien")).toBe("O'Brien");
  });
});
