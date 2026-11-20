import type TestAgent from 'supertest/lib/agent';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { CurrencyCode, PayFrequency } from '@acme/contracts';
import { insertEmployeeWithPay, type EmployeeSpec } from './fixtures';
import { startIntegrationApp, type IntegrationApp } from './harness';

let context: IntegrationApp;
let agent: TestAgent;

beforeAll(async () => {
  context = await startIntegrationApp();
});

afterAll(async () => {
  await context.close();
});

beforeEach(async () => {
  await context.reset();
  agent = await context.loginAgent();
});

const pay = (
  amount: string,
  currencyCode: CurrencyCode,
  payFrequency: PayFrequency,
  from = '2023-01-01',
  to?: string,
) => ({ amount, currencyCode, payFrequency, from, ...(to ? { to } : {}) });

const engineer = { department: 'Engineering', jobTitle: 'Engineer' } as const;
const seller = { department: 'Sales', jobTitle: 'Account Executive' } as const;

const FIXTURE: readonly EmployeeSpec[] = [
  { lastName: 'A', countryCode: 'NG', ...engineer, periods: [pay('4000000.00', 'NGN', 'annual')] },
  { lastName: 'B', countryCode: 'NG', ...engineer, periods: [pay('6000000.00', 'NGN', 'annual')] },
  { lastName: 'C', countryCode: 'NG', ...seller, periods: [pay('5000000.00', 'NGN', 'annual')] },
  { lastName: 'D', countryCode: 'GH', ...seller, periods: [pay('90000.00', 'GHS', 'annual')] },
  { lastName: 'E', countryCode: 'US', ...engineer, periods: [pay('120000.00', 'USD', 'annual')] },
  { lastName: 'F', countryCode: 'US', ...engineer, periods: [pay('10000.00', 'USD', 'monthly')] },
  { lastName: 'G', countryCode: 'NG', ...engineer, periods: [pay('5000.00', 'USD', 'monthly')] },
  {
    lastName: 'H',
    countryCode: 'US',
    ...seller,
    status: 'inactive',
    periods: [pay('80000.00', 'USD', 'annual')],
  },
  { lastName: 'I', countryCode: 'NG', ...seller },
  {
    lastName: 'J',
    countryCode: 'NG',
    ...seller,
    periods: [pay('1000000.00', 'NGN', 'annual', '2019-01-01', '2020-01-01')],
  },
];

const seedFixture = async (): Promise<void> => {
  for (const spec of FIXTURE) await insertEmployeeWithPay(context.database, spec);
};

describe('GET /insights/overview', () => {
  it('counts employees by status, country, department and pay mix', async () => {
    await seedFixture();

    const response = await agent.get('/api/v1/insights/overview');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      totalEmployees: 10,
      activeEmployees: 9,
      inactiveEmployees: 1,
      withoutCurrentCompensation: 2,
      byCountry: [
        { key: 'NG', headcount: 6 },
        { key: 'US', headcount: 3 },
        { key: 'GH', headcount: 1 },
      ],
      byDepartment: [
        { key: 'Engineering', headcount: 5 },
        { key: 'Sales', headcount: 5 },
      ],
      payMix: [
        { currencyCode: 'NGN', payFrequency: 'annual', headcount: 3 },
        { currencyCode: 'USD', payFrequency: 'annual', headcount: 2 },
        { currencyCode: 'USD', payFrequency: 'monthly', headcount: 2 },
        { currencyCode: 'GHS', payFrequency: 'annual', headcount: 1 },
      ],
    });
  });

  it('returns zeros for an empty organisation', async () => {
    const response = await agent.get('/api/v1/insights/overview');

    expect(response.body.data).toMatchObject({
      totalEmployees: 0,
      withoutCurrentCompensation: 0,
      byCountry: [],
      payMix: [],
    });
  });
});

describe('GET /insights/salary-distribution', () => {
  beforeEach(seedFixture);

  it('never mixes currencies or pay frequencies in one statistic', async () => {
    const response = await agent.get(
      '/api/v1/insights/salary-distribution?employmentStatus=active',
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        group: null,
        currencyCode: 'GHS',
        payFrequency: 'annual',
        headcount: 1,
        minimum: '90000.00',
        median: '90000.00',
        average: '90000.00',
        maximum: '90000.00',
      },
      {
        group: null,
        currencyCode: 'NGN',
        payFrequency: 'annual',
        headcount: 3,
        minimum: '4000000.00',
        median: '5000000.00',
        average: '5000000.00',
        maximum: '6000000.00',
      },
      {
        group: null,
        currencyCode: 'USD',
        payFrequency: 'annual',
        headcount: 1,
        minimum: '120000.00',
        median: '120000.00',
        average: '120000.00',
        maximum: '120000.00',
      },
      {
        group: null,
        currencyCode: 'USD',
        payFrequency: 'monthly',
        headcount: 2,
        minimum: '5000.00',
        median: '7500.00',
        average: '7500.00',
        maximum: '10000.00',
      },
    ]);
  });

  it('includes inactive employees when no status filter is given', async () => {
    const response = await agent.get(
      '/api/v1/insights/salary-distribution?countryCode=US&groupBy=department',
    );

    const usdAnnual = response.body.data.filter(
      (row: { currencyCode: string; payFrequency: string }) =>
        row.currencyCode === 'USD' && row.payFrequency === 'annual',
    );
    expect(usdAnnual).toEqual([
      expect.objectContaining({ group: 'Engineering', headcount: 1, median: '120000.00' }),
      expect.objectContaining({ group: 'Sales', headcount: 1, median: '80000.00' }),
    ]);
  });

  it('groups by country within one currency and computes the median of an even group', async () => {
    const response = await agent.get(
      '/api/v1/insights/salary-distribution?groupBy=countryCode&department=Engineering',
    );

    expect(response.body.data).toEqual([
      expect.objectContaining({
        group: 'NG',
        currencyCode: 'NGN',
        headcount: 2,
        median: '5000000.00',
      }),
      expect.objectContaining({
        group: 'NG',
        currencyCode: 'USD',
        headcount: 1,
        median: '5000.00',
      }),
      expect.objectContaining({ group: 'US', currencyCode: 'USD', payFrequency: 'annual' }),
      expect.objectContaining({ group: 'US', currencyCode: 'USD', payFrequency: 'monthly' }),
    ]);
  });

  it('uses only the compensation in effect today', async () => {
    const response = await agent.get(
      '/api/v1/insights/salary-distribution?jobTitle=Account%20Executive&countryCode=NG&groupBy=jobTitle',
    );

    expect(response.body.data).toEqual([
      expect.objectContaining({ group: 'Account Executive', currencyCode: 'NGN', headcount: 1 }),
    ]);
  });

  it.each([
    'groupBy=password_hash',
    'countryCode=ZZ',
    'employmentStatus=retired',
    `department=${'x'.repeat(101)}`,
    'unknown=1',
  ])('rejects invalid query %s with 400', async (query) => {
    const response = await agent.get(`/api/v1/insights/salary-distribution?${query}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('treats injection attempts as plain filter text', async () => {
    const response = await agent.get(
      `/api/v1/insights/salary-distribution?department=${encodeURIComponent("x' OR 1=1;--")}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});

describe('GET /insights/data-quality', () => {
  it('reports missing, inconsistent and unusual pay', async () => {
    await seedFixture();
    const normal = (lastName: string) =>
      insertEmployeeWithPay(context.database, {
        lastName,
        countryCode: 'DE',
        department: 'Product',
        jobTitle: 'Analyst',
        periods: [pay('1000000.00', 'EUR', 'annual')],
      });
    for (const name of ['N1', 'N2', 'N3', 'N4', 'N5']) await normal(name);
    await insertEmployeeWithPay(context.database, {
      lastName: 'High',
      countryCode: 'DE',
      department: 'Product',
      jobTitle: 'Analyst',
      periods: [pay('10000000.00', 'EUR', 'annual')],
    });
    await insertEmployeeWithPay(context.database, {
      lastName: 'Low',
      countryCode: 'DE',
      department: 'Product',
      jobTitle: 'Analyst',
      periods: [pay('200000.00', 'EUR', 'annual')],
    });

    const response = await agent.get('/api/v1/insights/data-quality');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      activeWithoutCompensation: 2,
      inactiveWithCurrentCompensation: 1,
      outlierCount: 2,
    });
    expect(
      response.body.data.outliers.map((row: { name: string; groupMedian: string }) => [
        row.name,
        row.groupMedian,
      ]),
    ).toEqual([
      ['Test High', '1000000.00'],
      ['Test Low', '1000000.00'],
    ]);
  });

  it('does not judge groups that are too small to compare', async () => {
    await seedFixture();

    const response = await agent.get('/api/v1/insights/data-quality');

    expect(response.body.data.outlierCount).toBe(0);
  });
});

describe('directory filter for missing compensation', () => {
  it('lists employees without current pay and those with it', async () => {
    await seedFixture();

    const missing = await agent.get('/api/v1/employees?compensation=missing&limit=100');
    const present = await agent.get('/api/v1/employees?compensation=present&limit=100');

    expect(missing.body.data.map((row: { lastName: string }) => row.lastName).toSorted()).toEqual([
      'I',
      'J',
    ]);
    expect(present.body.meta.total).toBe(8);
    expect((await agent.get('/api/v1/employees?compensation=maybe')).status).toBe(400);
  });
});

describe('access control', () => {
  it.each(['overview', 'salary-distribution', 'data-quality'])(
    'requires a session for /insights/%s',
    async (route) => {
      const response = await context.anonymous().get(`/api/v1/insights/${route}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    },
  );
});
