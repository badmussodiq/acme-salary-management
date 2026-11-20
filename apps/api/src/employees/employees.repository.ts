import { Injectable } from '@nestjs/common';
import { sql, type Expression, type Kysely, type SqlBool } from 'kysely';
import type {
  CompensationFilter,
  CountryCode,
  CurrencyCode,
  EmployeeFacetsDto,
  EmployeeSortField,
  EmploymentStatus,
  SortDirection,
} from '@acme/contracts';
import { containsPattern, prefixPattern } from '../common/sql-like';
import { DatabaseService } from '../database/database.service';
import type { Database } from '../database/database.types';
import { withCurrentCompensation } from './current-compensation';
import type { EmployeeWithCompensationRow } from './employee.mapper';

export interface EmployeeFilters {
  readonly search?: string | undefined;
  readonly countryCode?: CountryCode | undefined;
  readonly department?: string | undefined;
  readonly jobTitle?: string | undefined;
  readonly employmentStatus?: EmploymentStatus | undefined;
  readonly currencyCode?: CurrencyCode | undefined;
  readonly compensation?: CompensationFilter | undefined;
}

export interface EmployeeSort {
  readonly by: EmployeeSortField;
  readonly direction: SortDirection;
}

export interface NewEmployee {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly countryCode: CountryCode;
  readonly department: string;
  readonly jobTitle: string;
  readonly hiredOn: string;
  readonly employmentStatus: EmploymentStatus;
}

export interface EmployeePatch {
  readonly first_name?: string;
  readonly last_name?: string;
  readonly email?: string;
  readonly country_code?: CountryCode;
  readonly department?: string;
  readonly job_title?: string;
  readonly employment_status?: EmploymentStatus;
}

type Executor = Kysely<Database>;

@Injectable()
export class EmployeesRepository {
  constructor(private readonly database: DatabaseService) {}

  private filtered(executor: Executor, filters: EmployeeFilters) {
    const base = withCurrentCompensation(executor);
    return base.where((eb) => {
      const conditions: Expression<SqlBool>[] = [];
      if (filters.search) {
        conditions.push(
          eb.or([
            eb(
              sql<string>`(e.first_name || ' ' || e.last_name)`,
              'ilike',
              containsPattern(filters.search),
            ),
            eb('e.employee_number', 'ilike', prefixPattern(filters.search)),
          ]),
        );
      }
      if (filters.countryCode) conditions.push(eb('e.country_code', '=', filters.countryCode));
      if (filters.department) conditions.push(eb('e.department', '=', filters.department));
      if (filters.jobTitle) conditions.push(eb('e.job_title', '=', filters.jobTitle));
      if (filters.employmentStatus) {
        conditions.push(eb('e.employment_status', '=', filters.employmentStatus));
      }
      if (filters.currencyCode) conditions.push(eb('c.currency_code', '=', filters.currencyCode));
      if (filters.compensation === 'missing') conditions.push(eb('c.id', 'is', null));
      if (filters.compensation === 'present') conditions.push(eb('c.id', 'is not', null));
      return eb.and(conditions);
    });
  }

  async list(
    filters: EmployeeFilters,
    sort: EmployeeSort,
    limit: number,
    offset: number,
  ): Promise<{ readonly rows: readonly EmployeeWithCompensationRow[]; readonly total: number }> {
    const executor = this.database.db;
    const totalRow = await this.filtered(executor, filters)
      .select((eb) => eb.fn.countAll<string>().as('total'))
      .executeTakeFirstOrThrow();

    const direction = sort.direction;
    let query = this.filtered(executor, filters)
      .selectAll('e')
      .select([
        'c.amount as comp_amount',
        'c.currency_code as comp_currency_code',
        'c.pay_frequency as comp_pay_frequency',
        'c.effective_from as comp_effective_from',
      ]);

    switch (sort.by) {
      case 'name':
        query = query.orderBy('e.last_name', direction).orderBy('e.first_name', direction);
        break;
      case 'countryCode':
        query = query.orderBy('e.country_code', direction);
        break;
      case 'department':
        query = query.orderBy('e.department', direction);
        break;
      case 'jobTitle':
        query = query.orderBy('e.job_title', direction);
        break;
      case 'employmentStatus':
        query = query.orderBy('e.employment_status', direction);
        break;
      case 'hiredOn':
        query = query.orderBy('e.hired_on', direction);
        break;
      case 'employeeNumber':
        query = query.orderBy('e.employee_number', direction);
        break;
    }

    const rows = await query.orderBy('e.id').limit(limit).offset(offset).execute();
    return { rows, total: Number(totalRow.total) };
  }

  findDetail(
    id: string,
    executor: Executor = this.database.db,
  ): Promise<EmployeeWithCompensationRow | undefined> {
    return withCurrentCompensation(executor)
      .selectAll('e')
      .select([
        'c.amount as comp_amount',
        'c.currency_code as comp_currency_code',
        'c.pay_frequency as comp_pay_frequency',
        'c.effective_from as comp_effective_from',
      ])
      .where('e.id', '=', id)
      .executeTakeFirst();
  }

  lockById(executor: Executor, id: string) {
    return executor
      .selectFrom('employees')
      .selectAll()
      .where('id', '=', id)
      .forUpdate()
      .executeTakeFirst();
  }

  insert(executor: Executor, employee: NewEmployee) {
    return executor
      .insertInto('employees')
      .values({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        country_code: employee.countryCode,
        department: employee.department,
        job_title: employee.jobTitle,
        hired_on: employee.hiredOn,
        employment_status: employee.employmentStatus,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  update(executor: Executor, id: string, patch: EmployeePatch) {
    return executor
      .updateTable('employees')
      .set({ ...patch, version: sql<number>`version + 1`, updated_at: sql<Date>`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async facets(): Promise<EmployeeFacetsDto> {
    const { db } = this.database;
    const [countries, departments, jobTitles, currencies] = await Promise.all([
      db
        .selectFrom('employees')
        .select('country_code as value')
        .distinct()
        .orderBy('value')
        .execute(),
      db
        .selectFrom('employees')
        .select('department as value')
        .distinct()
        .orderBy('value')
        .execute(),
      db.selectFrom('employees').select('job_title as value').distinct().orderBy('value').execute(),
      db
        .selectFrom('compensations')
        .select('currency_code as value')
        .distinct()
        .orderBy('value')
        .execute(),
    ]);
    return {
      countries: countries.map((row) => row.value),
      departments: departments.map((row) => row.value),
      jobTitles: jobTitles.map((row) => row.value),
      currencies: currencies.map((row) => row.value),
    };
  }
}
