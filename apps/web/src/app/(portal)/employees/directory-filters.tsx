import type { EmployeeFacetsDto, ListEmployeesQuery } from '@acme/contracts';
import { FILTER_INPUT_CLASS, FilterSelect, plainOptions } from '@/components/filter-select';
import { buttonClass } from '@/components/ui';
import { countryName } from '@/lib/format';
import { STATUS_OPTIONS } from '@/lib/options';

export const DirectoryFilters = ({
  query,
  facets,
}: {
  readonly query: ListEmployeesQuery;
  readonly facets: EmployeeFacetsDto;
}) => (
  <form
    method="get"
    action="/employees"
    className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
  >
    <label className="block text-xs font-medium text-slate-600 lg:col-span-2">
      Search name or employee number
      <input
        name="search"
        type="search"
        maxLength={100}
        defaultValue={query.search ?? ''}
        placeholder="e.g. Okafor or EMP-000123"
        className={FILTER_INPUT_CLASS}
      />
    </label>
    <FilterSelect
      name="countryCode"
      label="Country"
      value={query.countryCode}
      options={facets.countries.map((code) => ({ value: code, label: countryName(code) }))}
    />
    <FilterSelect
      name="department"
      label="Department"
      value={query.department}
      options={plainOptions(facets.departments)}
    />
    <FilterSelect
      name="jobTitle"
      label="Job title"
      value={query.jobTitle}
      options={plainOptions(facets.jobTitles)}
    />
    <FilterSelect
      name="currencyCode"
      label="Currency"
      value={query.currencyCode}
      options={plainOptions(facets.currencies)}
    />
    <FilterSelect
      name="employmentStatus"
      label="Status"
      value={query.employmentStatus}
      options={STATUS_OPTIONS}
    />
    <FilterSelect
      name="compensation"
      label="Compensation"
      value={query.compensation}
      options={[
        { value: 'missing', label: 'Missing current pay' },
        { value: 'present', label: 'Has current pay' },
      ]}
    />
    {query.sortBy ? <input type="hidden" name="sortBy" value={query.sortBy} /> : null}
    {query.sortDir ? <input type="hidden" name="sortDir" value={query.sortDir} /> : null}
    <div className="flex items-end gap-2 lg:col-span-2">
      <button type="submit" className={buttonClass('primary')}>
        Apply filters
      </button>
      <a href="/employees" className={buttonClass('secondary')}>
        Reset
      </a>
    </div>
  </form>
);
