import {
  COUNTRY_CODES,
  CURRENCY_CODES,
  EMPLOYEE_SORT_FIELDS,
  EMPLOYMENT_STATUSES,
  PAGE_LIMIT_DEFAULT,
  SORT_DIRECTIONS,
  type ListEmployeesQuery,
} from '@acme/contracts';

export type RawSearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

const first = (value: string | readonly string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

const oneOf = <T extends string>(allowed: readonly T[], value: string | undefined): T | undefined =>
  allowed.find((item) => item === value);

const positiveInt = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
};

const bounded = (value: string | undefined, max: number): string | undefined =>
  value === undefined ? undefined : value.slice(0, max);

export const parseDirectoryQuery = (raw: RawSearchParams): ListEmployeesQuery => {
  const search = bounded(first(raw['search']), 100);
  const department = bounded(first(raw['department']), 100);
  const jobTitle = bounded(first(raw['jobTitle']), 100);
  const page = positiveInt(first(raw['page']));
  const countryCode = oneOf(COUNTRY_CODES, first(raw['countryCode']));
  const employmentStatus = oneOf(EMPLOYMENT_STATUSES, first(raw['employmentStatus']));
  const currencyCode = oneOf(CURRENCY_CODES, first(raw['currencyCode']));
  const sortBy = oneOf(EMPLOYEE_SORT_FIELDS, first(raw['sortBy']));
  const sortDir = oneOf(SORT_DIRECTIONS, first(raw['sortDir']));

  return {
    ...(search ? { search } : {}),
    ...(department ? { department } : {}),
    ...(jobTitle ? { jobTitle } : {}),
    ...(page ? { page } : {}),
    ...(countryCode ? { countryCode } : {}),
    ...(employmentStatus ? { employmentStatus } : {}),
    ...(currencyCode ? { currencyCode } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(sortDir ? { sortDir } : {}),
  };
};

export const toQueryString = (query: ListEmployeesQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
};

export const directoryHref = (
  query: ListEmployeesQuery,
  changes: ListEmployeesQuery = {},
): string => {
  const qs = toQueryString({ ...query, ...changes });
  return qs ? `/employees?${qs}` : '/employees';
};

export const nextSortDirection = (query: ListEmployeesQuery, field: string): 'asc' | 'desc' =>
  (query.sortBy ?? 'name') === field && (query.sortDir ?? 'asc') === 'asc' ? 'desc' : 'asc';

export const pageWindow = (meta: {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}): { readonly from: number; readonly to: number; readonly pages: number } => {
  const limit = meta.limit || PAGE_LIMIT_DEFAULT;
  const pages = Math.max(1, Math.ceil(meta.total / limit));
  return {
    from: meta.total === 0 ? 0 : (meta.page - 1) * limit + 1,
    to: Math.min(meta.page * limit, meta.total),
    pages,
  };
};
