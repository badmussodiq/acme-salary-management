import { describe, expect, it } from 'vitest';
import { countryName, formatDate, formatMoney, formatPay } from './format';

describe('format', () => {
  it('formats money in its own currency', () => {
    expect(formatMoney('85000.50', 'USD')).toBe('$85,000.50');
    expect(formatMoney('1000', 'NGN')).toContain('1,000.00');
  });

  it('appends the pay frequency', () => {
    expect(formatPay('120000', 'USD', 'annual')).toBe('$120,000.00 / yr');
    expect(formatPay('45', 'GBP', 'hourly')).toBe('£45.00 / hr');
  });

  it('formats calendar dates without timezone drift', () => {
    expect(formatDate('2024-03-01')).toBe('01 Mar 2024');
    expect(formatDate('2024-03-01T23:30:00.000Z')).toBe('01 Mar 2024');
  });

  it('falls back to the raw value for unparseable dates', () => {
    expect(formatDate('garbage')).toBe('garbage');
  });

  it('resolves country names', () => {
    expect(countryName('NG')).toBe('Nigeria');
  });
});
