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
  readonly summaryPage: number;
  readonly outlierPage: number;
}

const first = (value: string | readonly string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) || undefined;

const pageOf = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, 100_000) : 1;
};

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
    summaryPage: pageOf(first(raw['summaryPage'])),
    outlierPage: pageOf(first(raw['outlierPage'])),
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

export const SUMMARY_PAGE_SIZE = 25;

export const dashboardHref = (
  filters: DashboardFilters,
  pages: { readonly summaryPage?: number; readonly outlierPage?: number } = {},
): string => {
  const params = new URLSearchParams({ groupBy: filters.groupBy, status: filters.status });
  if (filters.countryCode) params.set('countryCode', filters.countryCode);
  if (filters.department) params.set('department', filters.department);
  if (filters.jobTitle) params.set('jobTitle', filters.jobTitle);
  const summaryPage = pages.summaryPage ?? filters.summaryPage;
  const outlierPage = pages.outlierPage ?? filters.outlierPage;
  if (summaryPage > 1) params.set('summaryPage', String(summaryPage));
  if (outlierPage > 1) params.set('outlierPage', String(outlierPage));
  return `/dashboard?${params.toString()}`;
};
