import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DemoDataService } from '../../src/seed/demo-data.service';
import { generateEmployees } from '../../src/seed/employee-generator';
import { startIntegrationApp, type IntegrationApp } from './harness';

let context: IntegrationApp;
let seeder: DemoDataService;

beforeAll(async () => {
  context = await startIntegrationApp();
  seeder = context.app.get(DemoDataService);
});

afterAll(async () => {
  await context.close();
});

beforeEach(async () => {
  await context.reset();
});

const count = async (table: 'employees' | 'compensations' | 'audit_events'): Promise<number> => {
  const row = await context.database.db
    .selectFrom(table)
    .select((eb) => eb.fn.countAll<string>().as('total'))
    .executeTakeFirstOrThrow();
  return Number(row.total);
};

const readEmployees = () =>
  context.database.db
    .selectFrom('employees')
    .select(['id', 'employee_number', 'email'])
    .orderBy('employee_number')
    .execute();

describe('DemoDataService', () => {
  it('inserts the requested synthetic employees with their pay history and audit trail', async () => {
    const expected = generateEmployees(300);

    const result = await seeder.seed({ count: 300 });

    expect(result).toEqual({ inserted: 300, skipped: false });
    expect(await count('employees')).toBe(300);
    expect(await count('compensations')).toBe(
      expected.reduce((sum, employee) => sum + employee.compensations.length, 0),
    );
    expect(await count('audit_events')).toBe(
      300 + expected.reduce((sum, employee) => sum + employee.compensations.length, 0),
    );
  });

  it('flags every employee as synthetic and numbers them in order', async () => {
    await seeder.seed({ count: 50 });

    const rows = await context.database.db
      .selectFrom('employees')
      .select(['employee_number', 'is_synthetic'])
      .orderBy('employee_number')
      .execute();

    expect(rows.every((row) => row.is_synthetic)).toBe(true);
    expect(rows[0]?.employee_number).toBe('EMP-000001');
    expect(rows.at(-1)?.employee_number).toBe('EMP-000050');
  });

  it('is idempotent: a second run changes nothing', async () => {
    await seeder.seed({ count: 100 });

    const again = await seeder.seed({ count: 100 });

    expect(again).toEqual({ inserted: 0, skipped: true });
    expect(await count('employees')).toBe(100);
  });

  it('rebuilds identical data after a reset', async () => {
    await seeder.seed({ count: 80 });
    const first = await readEmployees();

    await seeder.seed({ count: 80, reset: true });

    expect(await readEmployees()).toEqual(first);
  });

  it('attributes seeded audit events to the system, not a user', async () => {
    await seeder.seed({ count: 20 });

    const row = await context.database.db
      .selectFrom('audit_events')
      .select(['actor_user_id', 'request_id'])
      .executeTakeFirstOrThrow();

    expect(row).toEqual({ actor_user_id: null, request_id: 'seed' });
  });

  it('leaves no overlapping periods and at most one open period per employee', async () => {
    await seeder.seed({ count: 400 });

    const { rows } = await sql<{ employee_id: string }>`
      SELECT employee_id FROM compensations WHERE effective_to IS NULL
      GROUP BY employee_id HAVING count(*) > 1
    `.execute(context.database.db);

    expect(rows).toEqual([]);
  });

  it('shows seeded employees through the API', async () => {
    await seeder.seed({ count: 120 });
    const agent = await context.loginAgent();

    const response = await agent.get('/api/v1/employees?limit=5');

    expect(response.body.meta.total).toBe(120);
    expect(response.body.data).toHaveLength(5);
  });
});
