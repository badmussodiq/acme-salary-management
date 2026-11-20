import type { CreateEmployeeRequest, CountryCode, CurrencyCode } from '@acme/contracts';
import type { DatabaseService } from '../../src/database/database.service';

let counter = 0;

const letters = (value: number): string =>
  value
    .toString(26)
    .replace(/[0-9a-p]/g, (digit) => String.fromCharCode(97 + Number.parseInt(digit, 26)));

export const employeePayload = (overrides: object = {}): CreateEmployeeRequest => {
  counter += 1;
  return {
    firstName: 'Ada',
    lastName: `Lovelace${letters(counter)}`,
    email: `ada.${counter}@example.com`,
    countryCode: 'NG',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    hiredOn: '2024-03-01',
    compensation: {
      amount: '5000000.00',
      currencyCode: 'NGN',
      payFrequency: 'annual',
      effectiveFrom: '2024-03-01',
    },
    ...overrides,
  };
};

export interface BulkEmployee {
  readonly firstName: string;
  readonly lastName: string;
  readonly countryCode: CountryCode;
  readonly department: string;
  readonly jobTitle: string;
  readonly currencyCode: CurrencyCode;
  readonly amount: string;
}

export const insertEmployees = async (
  database: DatabaseService,
  employees: readonly BulkEmployee[],
): Promise<void> => {
  for (const [index, employee] of employees.entries()) {
    const row = await database.db
      .insertInto('employees')
      .values({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: `bulk.${index}.${employee.lastName.toLowerCase()}@example.com`,
        country_code: employee.countryCode,
        department: employee.department,
        job_title: employee.jobTitle,
        hired_on: '2023-01-15',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    await database.db
      .insertInto('compensations')
      .values({
        employee_id: row.id,
        amount: employee.amount,
        currency_code: employee.currencyCode,
        pay_frequency: 'annual',
        effective_from: '2023-01-15',
      })
      .execute();
  }
};
