import type { EmployeeFacetsDto, ListEmployeesQuery } from '@acme/contracts';
import { buttonClass } from '@/components/ui';
import { countryName } from '@/lib/format';
import { STATUS_OPTIONS } from '@/lib/options';

const CONTROL =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';

const Select = ({
  name,
  label,
  value,
  options,
}: {
  readonly name: string;
  readonly label: string;
  readonly value: string | undefined;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}) => (
  <label className="block text-xs font-medium text-slate-600">
    {label}
    <select name={name} defaultValue={value ?? ''} className={`${CONTROL} mt-1`}>
      <option value="">All</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const plain = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

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
        className={`${CONTROL} mt-1`}
      />
    </label>
    <Select
      name="countryCode"
      label="Country"
      value={query.countryCode}
      options={facets.countries.map((code) => ({ value: code, label: countryName(code) }))}
    />
    <Select
      name="department"
      label="Department"
      value={query.department}
      options={plain(facets.departments)}
    />
    <Select
      name="jobTitle"
      label="Job title"
      value={query.jobTitle}
      options={plain(facets.jobTitles)}
    />
    <Select
      name="currencyCode"
      label="Currency"
      value={query.currencyCode}
      options={plain(facets.currencies)}
    />
    <Select
      name="employmentStatus"
      label="Status"
      value={query.employmentStatus}
      options={STATUS_OPTIONS}
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
