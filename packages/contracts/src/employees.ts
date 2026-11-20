import type {
  AuditAction,
  CountryCode,
  CurrencyCode,
  EmploymentStatus,
  JsonValue,
  PayFrequency,
} from './domain';

export interface CompensationDto {
  readonly id: string;
  readonly employeeId: string;
  readonly amount: string;
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly createdAt: string;
}

export type CurrentCompensationDto = Pick<
  CompensationDto,
  'amount' | 'currencyCode' | 'payFrequency' | 'effectiveFrom'
>;

export interface EmployeeSummaryDto {
  readonly id: string;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly countryCode: CountryCode;
  readonly department: string;
  readonly jobTitle: string;
  readonly employmentStatus: EmploymentStatus;
  readonly hiredOn: string;
  readonly currentCompensation: CurrentCompensationDto | null;
}

export interface EmployeeDetailDto extends EmployeeSummaryDto {
  readonly version: number;
  readonly isSynthetic: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuditEventDto {
  readonly id: string;
  readonly employeeId: string | null;
  readonly actorEmail: string | null;
  readonly action: AuditAction;
  readonly before: JsonValue;
  readonly after: JsonValue;
  readonly requestId: string;
  readonly createdAt: string;
}

export interface EmployeeFacetsDto {
  readonly countries: readonly CountryCode[];
  readonly departments: readonly string[];
  readonly jobTitles: readonly string[];
  readonly currencies: readonly CurrencyCode[];
}

export const EMPLOYEE_SORT_FIELDS = [
  'employeeNumber',
  'name',
  'countryCode',
  'department',
  'jobTitle',
  'employmentStatus',
  'hiredOn',
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const COMPENSATION_FILTERS = ['missing', 'present'] as const;
export type CompensationFilter = (typeof COMPENSATION_FILTERS)[number];

export interface ListEmployeesQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly countryCode?: CountryCode;
  readonly department?: string;
  readonly jobTitle?: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly currencyCode?: CurrencyCode;
  readonly compensation?: CompensationFilter;
  readonly sortBy?: EmployeeSortField;
  readonly sortDir?: SortDirection;
}

export interface CompensationInput {
  readonly amount: string;
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly effectiveFrom: string;
}

export interface CreateEmployeeRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly countryCode: CountryCode;
  readonly department: string;
  readonly jobTitle: string;
  readonly hiredOn: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly compensation: CompensationInput;
}

export interface UpdateEmployeeRequest {
  readonly version: number;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly countryCode?: CountryCode;
  readonly department?: string;
  readonly jobTitle?: string;
  readonly employmentStatus?: EmploymentStatus;
}

export const PAGE_LIMIT_DEFAULT = 25;
export const PAGE_LIMIT_MAX = 100;
