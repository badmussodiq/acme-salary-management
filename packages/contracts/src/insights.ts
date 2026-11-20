import type { CountryCode, CurrencyCode, EmploymentStatus, PayFrequency } from './domain';

export const DISTRIBUTION_GROUPINGS = ['none', 'countryCode', 'department', 'jobTitle'] as const;
export type DistributionGrouping = (typeof DISTRIBUTION_GROUPINGS)[number];

export interface HeadcountEntry {
  readonly key: string;
  readonly headcount: number;
}

export interface PayMixEntry {
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly headcount: number;
}

export interface OverviewDto {
  readonly totalEmployees: number;
  readonly activeEmployees: number;
  readonly inactiveEmployees: number;
  readonly withoutCurrentCompensation: number;
  readonly byCountry: readonly HeadcountEntry[];
  readonly byDepartment: readonly HeadcountEntry[];
  readonly payMix: readonly PayMixEntry[];
}

export interface DistributionQuery {
  readonly groupBy?: DistributionGrouping;
  readonly countryCode?: CountryCode;
  readonly department?: string;
  readonly jobTitle?: string;
  readonly employmentStatus?: EmploymentStatus;
}

export interface DistributionRowDto {
  readonly group: string | null;
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly headcount: number;
  readonly minimum: string;
  readonly median: string;
  readonly average: string;
  readonly maximum: string;
}

export interface OutlierDto {
  readonly employeeId: string;
  readonly employeeNumber: string;
  readonly name: string;
  readonly jobTitle: string;
  readonly amount: string;
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly groupMedian: string;
}

export interface DataQualityDto {
  readonly activeWithoutCompensation: number;
  readonly inactiveWithCurrentCompensation: number;
  readonly outlierCount: number;
  readonly outliers: readonly OutlierDto[];
}

export const OUTLIER_FACTOR = 3;
export const OUTLIER_MIN_GROUP_SIZE = 5;
export const OUTLIER_SAMPLE_SIZE = 20;
