import {
  COUNTRY_CODES,
  DISTRIBUTION_GROUPINGS,
  EMPLOYMENT_STATUSES,
  type CountryCode,
  type DistributionGrouping,
  type DistributionQuery,
  type EmploymentStatus,
} from '@acme/contracts';
import type { RawSearchParams } from './directory-query';

export const ALL_STATUSES = 'all';

export interface DashboardFilters {
  readonly groupBy: DistributionGrouping;
  readonly countryCode: CountryCode | undefined;
  readonly department: string | undefined;
  readonly jobTitle: string | undefined;
  readonly status: EmploymentStatus | typeof ALL_STATUSES;
}

const first = (value: string | readonly string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) || undefined;

const oneOf = <T extends string>(allowed: readonly T[], value: string | undefined): T | undefined =>
  allowed.find((item) => item === value);

export const parseDashboardFilters = (raw: RawSearchParams): DashboardFilters => {
  const status = first(raw['status']);
  return {
    groupBy: oneOf(DISTRIBUTION_GROUPINGS, first(raw['groupBy'])) ?? 'countryCode',
    countryCode: oneOf(COUNTRY_CODES, first(raw['countryCode'])),
    department: first(raw['department']),
    jobTitle: first(raw['jobTitle']),
    status:
      status === ALL_STATUSES ? ALL_STATUSES : (oneOf(EMPLOYMENT_STATUSES, status) ?? 'active'),
  };
};

export const toDistributionQuery = (filters: DashboardFilters): DistributionQuery => ({
  groupBy: filters.groupBy,
  ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
  ...(filters.department ? { department: filters.department } : {}),
  ...(filters.jobTitle ? { jobTitle: filters.jobTitle } : {}),
  ...(filters.status === ALL_STATUSES ? {} : { employmentStatus: filters.status }),
});

export const distributionQueryString = (query: DistributionQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
};
