import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES, CURRENCY_CODES } from '@acme/contracts';
import { isCalendarDate, isPositiveMoney } from '../common/validators';
import { DEFAULT_SEED, generateEmployees, SEED_EMAIL_DOMAIN } from './employee-generator';
import { createRandom, deterministicUuid } from './random';

const employees = generateEmployees(10_000);

const average = (title: string): number => {
  const amounts = employees
    .filter((employee) => employee.jobTitle === title && employee.countryCode === 'US')
    .flatMap((employee) => employee.compensations.slice(-1))
    .filter((pay) => pay.payFrequency === 'annual')
    .map((pay) => Number(pay.amount));
  return amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
};

describe('createRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const first = createRandom(7);
    const second = createRandom(7);

    expect(Array.from({ length: 5 }, () => first.next())).toEqual(
      Array.from({ length: 5 }, () => second.next()),
    );
  });

  it('stays within bounds', () => {
    const random = createRandom(1);
    const values = Array.from({ length: 1000 }, () => random.int(3, 9));

    expect(Math.min(...values)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...values)).toBeLessThanOrEqual(9);
  });
});

describe('deterministicUuid', () => {
  it('is stable, unique per index and shaped like a UUID', () => {
    expect(deterministicUuid('ns', 1)).toBe(deterministicUuid('ns', 1));
    expect(deterministicUuid('ns', 1)).not.toBe(deterministicUuid('ns', 2));
    expect(deterministicUuid('ns', 1)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

describe('generateEmployees', () => {
  it('is deterministic for a seed and different for another', () => {
    expect(generateEmployees(200, DEFAULT_SEED)).toEqual(generateEmployees(200, DEFAULT_SEED));
    expect(generateEmployees(200, DEFAULT_SEED + 1)).not.toEqual(
      generateEmployees(200, DEFAULT_SEED),
    );
  });

  it('produces exactly the requested number of unique employees', () => {
    expect(employees).toHaveLength(10_000);
    expect(new Set(employees.map((employee) => employee.id)).size).toBe(10_000);
    expect(new Set(employees.map((employee) => employee.email)).size).toBe(10_000);
  });

  it('only uses synthetic email addresses and valid values', () => {
    for (const employee of employees) {
      expect(employee.email.endsWith(`@${SEED_EMAIL_DOMAIN}`)).toBe(true);
      expect(isCalendarDate(employee.hiredOn)).toBe(true);
      expect(COUNTRY_CODES).toContain(employee.countryCode);
    }
  });

  it('spreads employees across countries, departments, titles and currencies', () => {
    const countries = new Set(employees.map((employee) => employee.countryCode));
    const departments = new Set(employees.map((employee) => employee.department));
    const titles = new Set(employees.map((employee) => employee.jobTitle));
    const currencies = new Set(
      employees.flatMap((employee) => employee.compensations.map((pay) => pay.currencyCode)),
    );

    expect(countries.size).toBe(COUNTRY_CODES.length);
    expect(departments.size).toBe(10);
    expect(titles.size).toBeGreaterThanOrEqual(25);
    expect(currencies.size).toBe(new Set(CURRENCY_CODES).size);
  });

  it('keeps country and pay currency separate for some employees', () => {
    const usdPaidAbroad = employees.filter(
      (employee) =>
        employee.countryCode !== 'US' &&
        employee.compensations.some((pay) => pay.currencyCode === 'USD'),
    );

    expect(usdPaidAbroad.length).toBeGreaterThan(100);
  });

  it('covers every pay frequency', () => {
    const frequencies = new Set(
      employees.flatMap((employee) => employee.compensations.map((pay) => pay.payFrequency)),
    );

    expect(frequencies).toEqual(new Set(['annual', 'monthly', 'hourly']));
  });

  it('writes valid, positive money amounts', () => {
    for (const employee of employees) {
      for (const pay of employee.compensations) expect(isPositiveMoney(pay.amount)).toBe(true);
    }
  });

  it('builds a contiguous, non-overlapping history with one open period', () => {
    for (const employee of employees) {
      const { compensations } = employee;
      if (compensations.length === 0) continue;

      expect(compensations[0]?.effectiveFrom).toBe(employee.hiredOn);
      expect(compensations.at(-1)?.effectiveTo).toBeNull();
      compensations.slice(0, -1).forEach((pay, index) => {
        const next = compensations[index + 1];
        expect(pay.effectiveTo).toBe(next?.effectiveFrom);
        expect(pay.effectiveTo !== null && pay.effectiveTo > pay.effectiveFrom).toBe(true);
      });
      expect(new Set(compensations.map((pay) => pay.currencyCode)).size).toBe(1);
    }
  });

  it('includes realistic data-quality cases to find', () => {
    const missing = employees.filter(
      (employee) => employee.employmentStatus === 'active' && employee.compensations.length === 0,
    );
    const inactive = employees.filter((employee) => employee.employmentStatus === 'inactive');

    expect(missing.length).toBeGreaterThan(50);
    expect(missing.length).toBeLessThan(300);
    expect(inactive.length).toBeGreaterThan(400);
  });

  it('keeps salary bands in a believable order between roles', () => {
    expect(average('Staff Engineer')).toBeGreaterThan(average('Senior Software Engineer'));
    expect(average('Senior Software Engineer')).toBeGreaterThan(average('Software Engineer'));
  });
});
