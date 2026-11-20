import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import type { JsonValue } from '@acme/contracts';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DatabaseService } from '../database/database.service';
import type { Database } from '../database/database.types';
import { DEFAULT_SEED, generateEmployees, type SeedEmployee } from './employee-generator';

const BATCH_SIZE = 1000;
const ADVISORY_LOCK_KEY = 74_160_001;
const SEED_REQUEST_ID = 'seed';

export interface SeedOptions {
  readonly count: number;
  readonly reset?: boolean;
}

export interface SeedResult {
  readonly inserted: number;
  readonly skipped: boolean;
}

const chunk = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

const atNoon = (isoDate: string): Date => new Date(`${isoDate}T12:00:00Z`);

const employeeSnapshot = (employee: SeedEmployee): JsonValue => ({
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  countryCode: employee.countryCode,
  department: employee.department,
  jobTitle: employee.jobTitle,
  employmentStatus: employee.employmentStatus,
  hiredOn: employee.hiredOn,
});

@Injectable()
export class DemoDataService implements OnModuleInit {
  private readonly logger = new Logger(DemoDataService.name);

  constructor(
    private readonly database: DatabaseService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.seedDemoData) return;
    const result = await this.seed({ count: this.config.seedEmployeeCount });
    if (!result.skipped) this.logger.log(`Seeded ${result.inserted} synthetic employees`);
  }

  async seed(options: SeedOptions): Promise<SeedResult> {
    const result = await this.insertAll(options);
    if (!result.skipped) {
      await sql`ANALYZE employees, compensations, audit_events`.execute(this.database.db);
    }
    return result;
  }

  private insertAll(options: SeedOptions): Promise<SeedResult> {
    return this.database.db.transaction().execute(async (trx) => {
      await sql`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_KEY})`.execute(trx);

      if (options.reset) {
        await sql`TRUNCATE audit_events, compensations, employees`.execute(trx);
        await sql`ALTER SEQUENCE employee_number_seq RESTART WITH 1`.execute(trx);
      } else if (await this.hasSyntheticEmployees(trx)) {
        return { inserted: 0, skipped: true };
      }

      const employees = generateEmployees(options.count, DEFAULT_SEED);
      await this.insertEmployees(trx, employees);
      await this.insertCompensations(trx, employees);
      await this.insertAuditEvents(trx, employees);
      return { inserted: employees.length, skipped: false };
    });
  }

  private async hasSyntheticEmployees(executor: Kysely<Database>): Promise<boolean> {
    const row = await executor
      .selectFrom('employees')
      .select('id')
      .where('is_synthetic', '=', true)
      .limit(1)
      .executeTakeFirst();
    return row !== undefined;
  }

  private async insertEmployees(
    executor: Kysely<Database>,
    employees: readonly SeedEmployee[],
  ): Promise<void> {
    for (const batch of chunk(employees, BATCH_SIZE)) {
      await executor
        .insertInto('employees')
        .values(
          batch.map((employee) => ({
            id: employee.id,
            first_name: employee.firstName,
            last_name: employee.lastName,
            email: employee.email,
            country_code: employee.countryCode,
            department: employee.department,
            job_title: employee.jobTitle,
            employment_status: employee.employmentStatus,
            hired_on: employee.hiredOn,
            is_synthetic: true,
            created_at: atNoon(employee.hiredOn),
            updated_at: atNoon(employee.hiredOn),
          })),
        )
        .execute();
    }
  }

  private async insertCompensations(
    executor: Kysely<Database>,
    employees: readonly SeedEmployee[],
  ): Promise<void> {
    const rows = employees.flatMap((employee) =>
      employee.compensations.map((compensation) => ({
        employee_id: employee.id,
        amount: compensation.amount,
        currency_code: compensation.currencyCode,
        pay_frequency: compensation.payFrequency,
        effective_from: compensation.effectiveFrom,
        effective_to: compensation.effectiveTo,
        created_at: atNoon(compensation.effectiveFrom),
      })),
    );
    for (const batch of chunk(rows, BATCH_SIZE)) {
      await executor.insertInto('compensations').values(batch).execute();
    }
  }

  private async insertAuditEvents(
    executor: Kysely<Database>,
    employees: readonly SeedEmployee[],
  ): Promise<void> {
    const events = employees.flatMap((employee) => [
      {
        actor_user_id: null,
        employee_id: employee.id,
        action: 'employee.created' as const,
        before_snapshot: JSON.stringify(null),
        after_snapshot: JSON.stringify(employeeSnapshot(employee)),
        request_id: SEED_REQUEST_ID,
        created_at: atNoon(employee.hiredOn),
      },
      ...employee.compensations.map((compensation, index) => {
        const previous = employee.compensations[index - 1];
        return {
          actor_user_id: null,
          employee_id: employee.id,
          action: 'compensation.added' as const,
          before_snapshot: JSON.stringify(previous ? { ...previous } : null),
          after_snapshot: JSON.stringify({ ...compensation }),
          request_id: SEED_REQUEST_ID,
          created_at: atNoon(compensation.effectiveFrom),
        };
      }),
    ]);
    for (const batch of chunk(events, BATCH_SIZE)) {
      await executor.insertInto('audit_events').values(batch).execute();
    }
  }
}
