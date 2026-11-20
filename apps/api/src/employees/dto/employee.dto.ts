import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  COMPENSATION_FILTERS,
  COUNTRY_CODES,
  CURRENCY_CODES,
  EMPLOYEE_SORT_FIELDS,
  EMPLOYMENT_STATUSES,
  PAY_FREQUENCIES,
  SORT_DIRECTIONS,
  type CompensationFilter,
  type CompensationInput,
  type CountryCode,
  type CreateEmployeeRequest,
  type CurrencyCode,
  type EmployeeSortField,
  type EmploymentStatus,
  type ListEmployeesQuery,
  type PayFrequency,
  type SortDirection,
  type UpdateEmployeeRequest,
} from '@acme/contracts';
import { PaginationQueryDto } from '../../common/pagination';
import {
  IsCalendarDate,
  IsPositiveMoney,
  LABEL_PATTERN,
  Lowercase,
  NAME_PATTERN,
  Trim,
} from '../../common/validators';

export class CompensationInputDto implements CompensationInput {
  @IsPositiveMoney()
  amount!: string;

  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @IsIn(PAY_FREQUENCIES)
  payFrequency!: PayFrequency;

  @IsCalendarDate()
  effectiveFrom!: string;
}

export class CreateEmployeeDto implements CreateEmployeeRequest {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NAME_PATTERN)
  firstName!: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NAME_PATTERN)
  lastName!: string;

  @Lowercase()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsIn(COUNTRY_CODES)
  countryCode!: CountryCode;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(LABEL_PATTERN)
  department!: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(LABEL_PATTERN)
  jobTitle!: string;

  @IsCalendarDate()
  hiredOn!: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: EmploymentStatus;

  @IsDefined()
  @ValidateNested()
  @Type(() => CompensationInputDto)
  compensation!: CompensationInputDto;
}

export class UpdateEmployeeDto implements UpdateEmployeeRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NAME_PATTERN)
  firstName?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NAME_PATTERN)
  lastName?: string;

  @IsOptional()
  @Lowercase()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsIn(COUNTRY_CODES)
  countryCode?: CountryCode;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(LABEL_PATTERN)
  department?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(LABEL_PATTERN)
  jobTitle?: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: EmploymentStatus;
}

export class ListEmployeesQueryDto extends PaginationQueryDto implements ListEmployeesQuery {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(COUNTRY_CODES)
  countryCode?: CountryCode;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @IsOptional()
  @IsIn(COMPENSATION_FILTERS)
  compensation?: CompensationFilter;

  @IsOptional()
  @IsIn(EMPLOYEE_SORT_FIELDS)
  sortBy?: EmployeeSortField;

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDir?: SortDirection;
}

export class AuditQueryDto extends PaginationQueryDto {}
