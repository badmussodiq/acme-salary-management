import { performance } from 'node:perf_hooks';
import type TestAgent from 'supertest/lib/agent';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DemoDataService } from '../../src/seed/demo-data.service';
import { startIntegrationApp, type IntegrationApp } from './harness';

const EMPLOYEES = 10_000;
const RUNS = 5;
const BUDGET_MS = 1500;
const SEED_BUDGET_MS = 60_000;

let context: IntegrationApp;
let agent: TestAgent;
let employeeId = '';
const timings: { operation: string; medianMs: number; maxMs: number }[] = [];

const measure = async (operation: string, path: string): Promise<void> => {
  const samples: number[] = [];
  for (let run = 0; run < RUNS; run += 1) {
    const started = performance.now();
    const response = await agent.get(path);
    samples.push(performance.now() - started);
    expect(response.status).toBe(200);
  }
  const sorted = samples.toSorted((a, b) => a - b);
  const medianMs = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const maxMs = sorted.at(-1) ?? 0;
  timings.push({ operation, medianMs, maxMs });
  expect(medianMs).toBeLessThan(BUDGET_MS);
};

beforeAll(async () => {
  context = await startIntegrationApp();
  agent = await context.loginAgent();
});

afterAll(async () => {
  const table = timings
    .map(
      (row) =>
        `${row.operation.padEnd(46)} median ${row.medianMs.toFixed(1).padStart(7)} ms   max ${row.maxMs.toFixed(1).padStart(7)} ms`,
    )
    .join('\n');
  process.stdout.write(`\nPerformance with ${EMPLOYEES} employees (${RUNS} runs each)\n${table}\n`);
  await context.close();
});

describe(`with ${EMPLOYEES} seeded employees`, () => {
  it('seeds from an empty database within budget', async () => {
    const started = performance.now();
    const result = await context.app.get(DemoDataService).seed({ count: EMPLOYEES });
    const elapsed = performance.now() - started;
    timings.push({ operation: 'seed 10,000 employees (once)', medianMs: elapsed, maxMs: elapsed });

    expect(result.inserted).toBe(EMPLOYEES);
    expect(elapsed).toBeLessThan(SEED_BUDGET_MS);

    const first = await agent.get('/api/v1/employees?limit=1&search=EMP-000500');
    employeeId = first.body.data[0].id;
  });

  it('loads the first directory page', () => measure('directory: first page', '/api/v1/employees'));

  it('searches by employee number', () =>
    measure('directory: search by employee number', '/api/v1/employees?search=EMP-004321'));

  it('searches by name fragment', () =>
    measure('directory: search by name', '/api/v1/employees?search=okafor'));

  it('filters by country, department and currency', () =>
    measure(
      'directory: country + department + currency',
      '/api/v1/employees?countryCode=NG&department=Engineering&currencyCode=NGN',
    ));

  it('sorts and pages deep into the directory', () =>
    measure(
      'directory: page 200 sorted by hire date',
      '/api/v1/employees?page=200&limit=25&sortBy=hiredOn&sortDir=desc',
    ));

  it('finds employees without current compensation', () =>
    measure('directory: missing compensation', '/api/v1/employees?compensation=missing'));

  it('loads one employee with history and audit trail', async () => {
    await measure('employee: detail', `/api/v1/employees/${employeeId}`);
    await measure('employee: compensation history', `/api/v1/employees/${employeeId}/compensation`);
    await measure('employee: audit trail', `/api/v1/employees/${employeeId}/audit`);
  });

  it('computes the dashboard aggregates', async () => {
    await measure('insights: overview', '/api/v1/insights/overview');
    await measure(
      'insights: distribution by country (active)',
      '/api/v1/insights/salary-distribution?groupBy=countryCode&employmentStatus=active',
    );
    await measure(
      'insights: distribution by job title',
      '/api/v1/insights/salary-distribution?groupBy=jobTitle',
    );
    await measure('insights: data quality', '/api/v1/insights/data-quality');
  });
});
