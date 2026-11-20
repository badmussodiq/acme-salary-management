import { describe, expect, it } from 'vitest';
import {
  directoryHref,
  nextSortDirection,
  parseDirectoryQuery,
  toQueryString,
} from './directory-query';

describe('parseDirectoryQuery', () => {
  it('keeps recognised values and trims text', () => {
    expect(
      parseDirectoryQuery({
        search: '  ada  ',
        countryCode: 'NG',
        employmentStatus: 'active',
        currencyCode: 'USD',
        compensation: 'missing',
        sortBy: 'hiredOn',
        sortDir: 'desc',
        page: '3',
      }),
    ).toEqual({
      search: 'ada',
      countryCode: 'NG',
      employmentStatus: 'active',
      currencyCode: 'USD',
      compensation: 'missing',
      sortBy: 'hiredOn',
      sortDir: 'desc',
      page: 3,
    });
  });

  it('drops unknown, malformed and out-of-range values', () => {
    expect(
      parseDirectoryQuery({
        countryCode: 'ZZ',
        currencyCode: 'XXX',
        compensation: 'maybe',
        sortBy: 'password_hash',
        sortDir: 'up',
        page: '-2',
        employmentStatus: 'retired',
        search: '   ',
      }),
    ).toEqual({});
  });

  it('uses the first value of repeated parameters and caps text length', () => {
    const result = parseDirectoryQuery({ department: ['Sales', 'Legal'], search: 'x'.repeat(500) });

    expect(result.department).toBe('Sales');
    expect(result.search).toHaveLength(100);
  });
});

describe('links', () => {
  it('serialises only defined values', () => {
    expect(toQueryString({ search: 'ada', page: 2 })).toBe('search=ada&page=2');
  });

  it('merges changes into an existing query', () => {
    expect(directoryHref({ search: 'ada', page: 2 }, { page: 3 })).toBe(
      '/employees?search=ada&page=3',
    );
    expect(directoryHref({})).toBe('/employees');
  });

  it('toggles sort direction on the active column only', () => {
    expect(nextSortDirection({}, 'name')).toBe('desc');
    expect(nextSortDirection({ sortBy: 'name', sortDir: 'desc' }, 'name')).toBe('asc');
    expect(nextSortDirection({ sortBy: 'name' }, 'department')).toBe('asc');
  });
});
