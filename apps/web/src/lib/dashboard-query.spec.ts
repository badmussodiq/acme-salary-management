import { describe, expect, it } from 'vitest';
import {
  dashboardHref,
  distributionQueryString,
  parseDashboardFilters,
  toDistributionQuery,
} from './dashboard-query';

describe('parseDashboardFilters', () => {
  it('defaults to active employees grouped by country', () => {
    expect(parseDashboardFilters({})).toEqual({
      groupBy: 'countryCode',
      countryCode: undefined,
      department: undefined,
      jobTitle: undefined,
      status: 'active',
      summaryPage: 1,
      outlierPage: 1,
    });
  });

  it('keeps valid selections and the explicit "all" status', () => {
    expect(
      parseDashboardFilters({
        groupBy: 'jobTitle',
        countryCode: 'NG',
        department: 'Sales',
        status: 'all',
      }),
    ).toMatchObject({ groupBy: 'jobTitle', countryCode: 'NG', department: 'Sales', status: 'all' });
  });

  it('falls back safely for unknown values', () => {
    expect(
      parseDashboardFilters({ groupBy: 'salary', countryCode: 'ZZ', status: 'retired' }),
    ).toMatchObject({ groupBy: 'countryCode', countryCode: undefined, status: 'active' });
  });
});

describe('toDistributionQuery', () => {
  it('omits the status filter for "all" and drops unset filters', () => {
    const query = toDistributionQuery(
      parseDashboardFilters({ status: 'all', department: 'Sales' }),
    );

    expect(query).toEqual({ groupBy: 'countryCode', department: 'Sales' });
    expect(distributionQueryString(query)).toBe('groupBy=countryCode&department=Sales');
  });

  it('sends the active status by default', () => {
    expect(distributionQueryString(toDistributionQuery(parseDashboardFilters({})))).toBe(
      'groupBy=countryCode&employmentStatus=active',
    );
  });
});

describe('paging the dashboard lists', () => {
  it('reads page numbers and falls back to the first page', () => {
    expect(parseDashboardFilters({ summaryPage: '3', outlierPage: '2' })).toMatchObject({
      summaryPage: 3,
      outlierPage: 2,
    });
    expect(parseDashboardFilters({ summaryPage: '0' }).summaryPage).toBe(1);
    expect(parseDashboardFilters({ outlierPage: 'abc' }).outlierPage).toBe(1);
  });

  it('builds links that keep the filters', () => {
    const filters = parseDashboardFilters({
      countryCode: 'NG',
      department: 'Sales',
      status: 'all',
    });

    expect(dashboardHref(filters, { summaryPage: 2 })).toBe(
      '/dashboard?groupBy=countryCode&status=all&countryCode=NG&department=Sales&summaryPage=2',
    );
    expect(dashboardHref(filters)).not.toContain('Page=');
  });
});
