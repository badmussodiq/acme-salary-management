import { describe, expect, it } from 'vitest';
import {
  COUNTRIES,
  COUNTRY_CODES,
  CURRENCY_CODES,
  currencyOfCountry,
  isCountryCode,
  isCurrencyCode,
} from './domain';

describe('world reference data', () => {
  it('lists every country and territory once, with a well-formed code', () => {
    const codes = COUNTRIES.map((country) => country.code);

    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(194);
  });

  it('gives every country a name and a known currency', () => {
    for (const country of COUNTRIES) {
      expect(country.name.length).toBeGreaterThan(1);
      expect(isCurrencyCode(country.currency)).toBe(true);
    }
  });

  it('lists each currency once, in ISO 4217 form, and uses every one', () => {
    const used = new Set<string>(COUNTRIES.map((country) => country.currency));

    expect(new Set(CURRENCY_CODES).size).toBe(CURRENCY_CODES.length);
    expect(CURRENCY_CODES.every((code) => /^[A-Z]{3}$/.test(code))).toBe(true);
    expect(CURRENCY_CODES.filter((code) => !used.has(code))).toEqual([]);
  });

  it.each([
    ['NG', 'NGN'],
    ['US', 'USD'],
    ['GB', 'GBP'],
    ['FR', 'EUR'],
    ['DE', 'EUR'],
    ['IN', 'INR'],
    ['JP', 'JPY'],
    ['CH', 'CHF'],
    ['ZA', 'ZAR'],
    ['BR', 'BRL'],
    ['SS', 'SSP'],
    ['TV', 'AUD'],
  ] as const)('maps %s to %s', (country, currency) => {
    expect(currencyOfCountry(country)).toBe(currency);
  });

  it('includes countries that a short list would miss', () => {
    for (const code of ['VA', 'SS', 'BT', 'LI', 'MC', 'NR', 'PW', 'KI', 'TL', 'PS']) {
      expect(isCountryCode(code)).toBe(true);
    }
  });

  it('exposes the same codes through COUNTRY_CODES and rejects unknown ones', () => {
    expect(COUNTRY_CODES).toHaveLength(COUNTRIES.length);
    expect(isCountryCode('ZZ')).toBe(false);
    expect(isCountryCode('ng')).toBe(false);
    expect(isCountryCode(null)).toBe(false);
  });
});
