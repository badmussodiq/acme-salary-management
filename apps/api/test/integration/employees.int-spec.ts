import type TestAgent from 'supertest/lib/agent';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { employeePayload, insertEmployees, type BulkEmployee } from './fixtures';
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

const names = (body: { data: { lastName: string }[] }): string[] =>
  body.data.map((employee) => employee.lastName);

const createEmployee = async (overrides = {}) => {
  const response = await agent.post('/api/v1/employees').send(employeePayload(overrides));
  expect(response.status).toBe(201);
  return response.body.data;
};

describe('POST /employees', () => {
  it('creates an employee with an initial compensation and a generated number', async () => {
    const created = await createEmployee();

    expect(created).toMatchObject({
      employeeNumber: 'EMP-000001',
      version: 1,
      employmentStatus: 'active',
      currentCompensation: {
        amount: '5000000.00',
        currencyCode: 'NGN',
        payFrequency: 'annual',
        effectiveFrom: '2024-03-01',
      },
    });
  });

  it('records one audit event for the employee and one for the compensation', async () => {
    const created = await createEmployee();

    const audit = await agent.get(`/api/v1/employees/${created.id}/audit`);

    expect(audit.body.meta.total).toBe(2);
    expect(audit.body.data.map((event: { action: string }) => event.action).toSorted()).toEqual([
      'compensation.added',
      'employee.created',
    ]);
    expect(audit.body.data[0].actorEmail).toBe(context.config.initialHr?.email);
  });

  it('rejects a duplicate email with 409 and creates nothing', async () => {
    await createEmployee({ email: 'dup@example.com' });

    const response = await agent
      .post('/api/v1/employees')
      .send(employeePayload({ email: 'DUP@example.com' }));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    const list = await agent.get('/api/v1/employees');
    expect(list.body.meta.total).toBe(1);
  });

  it.each([
    ['unknown field', { isAdmin: true }],
    [
      'unsupported currency',
      {
        compensation: {
          amount: '10',
          currencyCode: 'XXX',
          payFrequency: 'annual',
          effectiveFrom: '2024-01-01',
        },
      },
    ],
    [
      'negative amount',
      {
        compensation: {
          amount: '-10',
          currencyCode: 'NGN',
          payFrequency: 'annual',
          effectiveFrom: '2024-01-01',
        },
      },
    ],
    [
      'float noise amount',
      {
        compensation: {
          amount: '10.999',
          currencyCode: 'NGN',
          payFrequency: 'annual',
          effectiveFrom: '2024-01-01',
        },
      },
    ],
    ['impossible date', { hiredOn: '2024-02-31' }],
    ['unsupported country', { countryCode: 'ZZ' }],
    ['script in name', { firstName: '<script>alert(1)</script>' }],
    ['sql in name', { lastName: "Robert'); DROP TABLE employees;--" }],
    ['empty department', { department: '   ' }],
    ['overlong job title', { jobTitle: 'x'.repeat(101) }],
    ['invalid email', { email: 'nope' }],
  ])('rejects %s with 400 VALIDATION_FAILED', async (_label, overrides) => {
    const response = await agent.post('/api/v1/employees').send(employeePayload(overrides));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it('requires a session', async () => {
    const response = await context.anonymous().post('/api/v1/employees').send(employeePayload());

    expect(response.status).toBe(401);
  });
});

describe('GET /employees', () => {
  const people: BulkEmployee[] = [
    {
      firstName: 'Ngozi',
      lastName: 'Okafor',
      countryCode: 'NG',
      department: 'Engineering',
      jobTitle: 'Engineer',
      currencyCode: 'NGN',
      amount: '6000000.00',
    },
    {
      firstName: 'Kwame',
      lastName: 'Mensah',
      countryCode: 'GH',
      department: 'Sales',
      jobTitle: 'Account Executive',
      currencyCode: 'GHS',
      amount: '90000.00',
    },
    {
      firstName: 'Amara',
      lastName: 'Eze',
      countryCode: 'NG',
      department: 'Sales',
      jobTitle: 'Account Executive',
      currencyCode: 'NGN',
      amount: '4500000.00',
    },
    {
      firstName: 'John',
      lastName: 'Smith',
      countryCode: 'US',
      department: 'Engineering',
      jobTitle: 'Engineer',
      currencyCode: 'USD',
      amount: '120000.00',
    },
  ];

  beforeEach(async () => {
    await insertEmployees(context.database, people);
  });

  it('paginates with metadata and a stable order', async () => {
    const first = await agent.get('/api/v1/employees?limit=2&page=1');
    const second = await agent.get('/api/v1/employees?limit=2&page=2');

    expect(first.body.meta).toEqual({ page: 1, limit: 2, total: 4 });
    expect(names(first.body)).toEqual(['Eze', 'Mensah']);
    expect(names(second.body)).toEqual(['Okafor', 'Smith']);
  });

  it('includes the current compensation of each employee', async () => {
    const response = await agent.get('/api/v1/employees?search=Mensah');

    expect(response.body.data[0].currentCompensation).toMatchObject({
      amount: '90000.00',
      currencyCode: 'GHS',
    });
  });

  it('searches by name fragment, full name and employee number', async () => {
    const byFragment = await agent.get('/api/v1/employees?search=okaf');
    const byFullName = await agent.get('/api/v1/employees?search=Kwame%20Mensah');
    const byNumber = await agent.get('/api/v1/employees?search=emp-000003');

    expect(names(byFragment.body)).toEqual(['Okafor']);
    expect(names(byFullName.body)).toEqual(['Mensah']);
    expect(names(byNumber.body)).toEqual(['Eze']);
  });

  it('treats wildcard and injection input as literal text', async () => {
    const wildcard = await agent.get('/api/v1/employees?search=%25');
    const injection = await agent.get(
      `/api/v1/employees?search=${encodeURIComponent("' OR 1=1; DROP TABLE employees;--")}`,
    );

    expect(wildcard.status).toBe(200);
    expect(wildcard.body.meta.total).toBe(0);
    expect(injection.status).toBe(200);
    expect(injection.body.meta.total).toBe(0);
    expect((await agent.get('/api/v1/employees')).body.meta.total).toBe(4);
  });

  it('filters by country, department, currency and combinations', async () => {
    const nigeria = await agent.get('/api/v1/employees?countryCode=NG');
    const sales = await agent.get('/api/v1/employees?department=Sales');
    const usd = await agent.get('/api/v1/employees?currencyCode=USD');
    const nigerianSales = await agent.get('/api/v1/employees?countryCode=NG&department=Sales');

    expect(names(nigeria.body)).toEqual(['Eze', 'Okafor']);
    expect(names(sales.body)).toEqual(['Eze', 'Mensah']);
    expect(names(usd.body)).toEqual(['Smith']);
    expect(names(nigerianSales.body)).toEqual(['Eze']);
  });

  it('sorts by an allowed field in both directions', async () => {
    const descending = await agent.get('/api/v1/employees?sortBy=name&sortDir=desc');
    const byCountry = await agent.get('/api/v1/employees?sortBy=countryCode&sortDir=asc');

    expect(names(descending.body)).toEqual(['Smith', 'Okafor', 'Mensah', 'Eze']);
    expect(byCountry.body.data[0].countryCode).toBe('GH');
  });

  it.each([
    'limit=101',
    'limit=0',
    'page=0',
    'page=abc',
    'sortBy=password_hash',
    'sortDir=sideways',
    'countryCode=ZZ',
    'employmentStatus=retired',
    `search=${'x'.repeat(101)}`,
    'unknown=1',
  ])('rejects invalid query %s with 400', async (query) => {
    const response = await agent.get(`/api/v1/employees?${query}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns facets for building filters', async () => {
    const response = await agent.get('/api/v1/employees/facets');

    expect(response.body.data).toEqual({
      countries: ['GH', 'NG', 'US'],
      departments: ['Engineering', 'Sales'],
      jobTitles: ['Account Executive', 'Engineer'],
      currencies: ['GHS', 'NGN', 'USD'],
    });
  });
});

describe('GET and PATCH /employees/:id', () => {
  it('returns 404 for an unknown employee and 400 for a malformed id', async () => {
    const missing = await agent.get('/api/v1/employees/00000000-0000-4000-8000-000000000000');
    const malformed = await agent.get('/api/v1/employees/not-a-uuid');

    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
    expect(malformed.status).toBe(400);
  });

  it('updates fields, bumps the version and audits only what changed', async () => {
    const created = await createEmployee();

    const response = await agent
      .patch(`/api/v1/employees/${created.id}`)
      .send({ version: 1, department: 'Finance', jobTitle: created.jobTitle });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ department: 'Finance', version: 2 });
    const audit = await agent.get(`/api/v1/employees/${created.id}/audit`);
    const update = audit.body.data.find(
      (event: { action: string }) => event.action === 'employee.updated',
    );
    expect(update.before).toEqual({ department: 'Engineering' });
    expect(update.after).toEqual({ department: 'Finance' });
  });

  it('rejects a stale version with 409', async () => {
    const created = await createEmployee();
    await agent
      .patch(`/api/v1/employees/${created.id}`)
      .send({ version: 1, department: 'Finance' });

    const stale = await agent
      .patch(`/api/v1/employees/${created.id}`)
      .send({ version: 1, department: 'Legal' });

    expect(stale.status).toBe(409);
    expect((await agent.get(`/api/v1/employees/${created.id}`)).body.data.department).toBe(
      'Finance',
    );
  });

  it('rejects an update that changes nothing and unknown fields', async () => {
    const created = await createEmployee();

    const noChange = await agent
      .patch(`/api/v1/employees/${created.id}`)
      .send({ version: 1, department: created.department });
    const unknown = await agent
      .patch(`/api/v1/employees/${created.id}`)
      .send({ version: 1, version2: 5 });

    expect(noChange.status).toBe(400);
    expect(unknown.status).toBe(400);
  });

  it('supports deactivating an employee', async () => {
    const created = await createEmployee();

    const response = await agent
      .patch(`/api/v1/employees/${created.id}`)
      .send({ version: 1, employmentStatus: 'inactive' });
    const inactive = await agent.get('/api/v1/employees?employmentStatus=inactive');

    expect(response.body.data.employmentStatus).toBe('inactive');
    expect(inactive.body.meta.total).toBe(1);
  });
});

describe('compensation history', () => {
  it('closes the previous period when a new one starts and exposes full history', async () => {
    const created = await createEmployee();

    const added = await agent.post(`/api/v1/employees/${created.id}/compensation`).send({
      amount: '6500000.00',
      currencyCode: 'NGN',
      payFrequency: 'annual',
      effectiveFrom: '2025-01-01',
    });
    const history = await agent.get(`/api/v1/employees/${created.id}/compensation`);
    const detail = await agent.get(`/api/v1/employees/${created.id}`);

    expect(added.status).toBe(201);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data[0]).toMatchObject({ amount: '6500000.00', effectiveTo: null });
    expect(history.body.data[1]).toMatchObject({
      amount: '5000000.00',
      effectiveTo: '2025-01-01',
    });
    expect(detail.body.data.currentCompensation.amount).toBe('6500000.00');
  });

  it('audits the change with before and after snapshots', async () => {
    const created = await createEmployee();
    await agent.post(`/api/v1/employees/${created.id}/compensation`).send({
      amount: '7000000.00',
      currencyCode: 'NGN',
      payFrequency: 'annual',
      effectiveFrom: '2025-06-01',
    });

    const audit = await agent.get(`/api/v1/employees/${created.id}/audit`);
    const latest = audit.body.data[0];

    expect(latest.action).toBe('compensation.added');
    expect(latest.before.amount).toBe('5000000.00');
    expect(latest.after.amount).toBe('7000000.00');
    expect(latest.requestId).toEqual(expect.any(String));
  });

  it.each(['2024-03-01', '2023-01-01'])(
    'rejects a start date of %s that is not after the latest period',
    async (effectiveFrom) => {
      const created = await createEmployee();

      const response = await agent.post(`/api/v1/employees/${created.id}/compensation`).send({
        amount: '1.00',
        currencyCode: 'NGN',
        payFrequency: 'annual',
        effectiveFrom,
      });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    },
  );

  it('rejects invalid compensation and unknown employees', async () => {
    const created = await createEmployee();
    const body = {
      amount: '0',
      currencyCode: 'NGN',
      payFrequency: 'annual',
      effectiveFrom: '2025-01-01',
    };

    const invalid = await agent.post(`/api/v1/employees/${created.id}/compensation`).send(body);
    const missing = await agent
      .post('/api/v1/employees/00000000-0000-4000-8000-000000000000/compensation')
      .send({ ...body, amount: '10' });

    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('keeps the audit trail append-only at the database level', async () => {
    const created = await createEmployee();

    await expect(
      context.database.db
        .deleteFrom('audit_events')
        .where('employee_id', '=', created.id)
        .execute(),
    ).rejects.toThrow('append-only');
  });
});
