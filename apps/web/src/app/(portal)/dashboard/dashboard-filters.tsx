import type { EmployeeFacetsDto } from '@acme/contracts';
import { FilterSelect, plainOptions } from '@/components/filter-select';
import { buttonClass } from '@/components/ui';
import { ALL_STATUSES, type DashboardFilters as Filters } from '@/lib/dashboard-query';
import { countryName } from '@/lib/format';

const GROUPINGS = [
  { value: 'none', label: 'No grouping' },
  { value: 'countryCode', label: 'Country' },
  { value: 'department', label: 'Department' },
  { value: 'jobTitle', label: 'Job title' },
] as const;

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: ALL_STATUSES, label: 'All' },
] as const;

export const DashboardFilters = ({
  filters,
  facets,
}: {
  readonly filters: Filters;
  readonly facets: EmployeeFacetsDto;
}) => (
  <form method="get" action="/dashboard" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
    <FilterSelect
      name="groupBy"
      label="Group by"
      value={filters.groupBy}
      options={GROUPINGS}
      allLabel={null}
    />
    <FilterSelect
      name="countryCode"
      label="Country"
      value={filters.countryCode}
      options={facets.countries.map((code) => ({ value: code, label: countryName(code) }))}
    />
    <FilterSelect
      name="department"
      label="Department"
      value={filters.department}
      options={plainOptions(facets.departments)}
    />
    <FilterSelect
      name="jobTitle"
      label="Job title"
      value={filters.jobTitle}
      options={plainOptions(facets.jobTitles)}
    />
    <FilterSelect
      name="status"
      label="Status"
      value={filters.status}
      options={STATUSES}
      allLabel={null}
    />
    <div className="flex items-end gap-2">
      <button type="submit" className={buttonClass('primary')}>
        Apply
      </button>
      <a href="/dashboard" className={buttonClass('secondary')}>
        Reset
      </a>
    </div>
  </form>
);
