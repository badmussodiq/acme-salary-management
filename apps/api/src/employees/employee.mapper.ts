import type { Selectable } from 'kysely';
import type {
  CompensationDto,
  CurrencyCode,
  EmployeeDetailDto,
  EmployeeSummaryDto,
  PayFrequency,
} from '@acme/contracts';
import type { CompensationsTable, EmployeesTable } from '../database/database.types';

export interface EmployeeWithCompensationRow extends Selectable<EmployeesTable> {
  readonly comp_amount: string | null;
  readonly comp_currency_code: CurrencyCode | null;
  readonly comp_pay_frequency: PayFrequency | null;
  readonly comp_effective_from: string | null;
}

const avatarUrlOf = (row: Selectable<EmployeesTable>): string | null =>
  row.avatar_key ? `/api/v1/employees/${row.id}/avatar?v=${row.updated_at.getTime()}` : null;

export const toEmployeeSummary = (row: EmployeeWithCompensationRow): EmployeeSummaryDto => ({
  id: row.id,
  employeeNumber: row.employee_number,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  countryCode: row.country_code,
  department: row.department,
  jobTitle: row.job_title,
  employmentStatus: row.employment_status,
  hiredOn: row.hired_on,
  avatarUrl: avatarUrlOf(row),
  currentCompensation:
    row.comp_amount && row.comp_currency_code && row.comp_pay_frequency && row.comp_effective_from
      ? {
          amount: row.comp_amount,
          currencyCode: row.comp_currency_code,
          payFrequency: row.comp_pay_frequency,
          effectiveFrom: row.comp_effective_from,
        }
      : null,
});

export const toEmployeeDetail = (row: EmployeeWithCompensationRow): EmployeeDetailDto => ({
  ...toEmployeeSummary(row),
  version: row.version,
  isSynthetic: row.is_synthetic,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const toCompensationDto = (row: Selectable<CompensationsTable>): CompensationDto => ({
  id: row.id,
  employeeId: row.employee_id,
  amount: row.amount,
  currencyCode: row.currency_code,
  payFrequency: row.pay_frequency,
  effectiveFrom: row.effective_from,
  effectiveTo: row.effective_to,
  createdAt: row.created_at.toISOString(),
});
