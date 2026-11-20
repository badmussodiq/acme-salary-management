import Link from 'next/link';
import type {
  EmployeeFacetsDto,
  EmployeeSortField,
  EmployeeSummaryDto,
  ListEmployeesQuery,
} from '@acme/contracts';
import { Avatar } from '@/components/avatar';
import { Pagination } from '@/components/pagination';
import { DataTable, type DataTableColumn } from '@acme/web-utils';
import { Badge, Card, LinkButton, PageHeader, TABLE_CLASS } from '@/components/ui';
import {
  directoryHref,
  nextSortDirection,
  parseDirectoryQuery,
  toQueryString,
  type RawSearchParams,
} from '@/lib/directory-query';
import { countryName, formatPay, fullName } from '@/lib/format';
import { serverData, serverGet } from '@/lib/server-api';
import { DirectoryFilters } from './directory-filters';

const sortable = (query: ListEmployeesQuery, field: EmployeeSortField, label: string) => {
  const active = (query.sortBy ?? 'name') === field;
  const direction = nextSortDirection(query, field);
  const arrow = active ? ((query.sortDir ?? 'asc') === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <Link href={directoryHref(query, { sortBy: field, sortDir: direction, page: 1 })}>
      {label}
      {arrow}
    </Link>
  );
};

const columnsFor = (query: ListEmployeesQuery): readonly DataTableColumn<EmployeeSummaryDto>[] => [
  {
    key: 'number',
    header: sortable(query, 'employeeNumber', 'Employee #'),
    cell: (row) => row.employeeNumber,
  },
  {
    key: 'name',
    header: sortable(query, 'name', 'Name'),
    cell: (row) => (
      <span className="flex items-center gap-3">
        <Avatar employee={row} />
        <Link href={`/employees/${row.id}`} className="font-medium text-brand-700 hover:underline">
          {fullName(row)}
        </Link>
      </span>
    ),
  },
  {
    key: 'country',
    header: sortable(query, 'countryCode', 'Country'),
    cell: (row) => countryName(row.countryCode),
  },
  {
    key: 'department',
    header: sortable(query, 'department', 'Department'),
    cell: (row) => row.department,
  },
  {
    key: 'jobTitle',
    header: sortable(query, 'jobTitle', 'Job title'),
    cell: (row) => row.jobTitle,
  },
  {
    key: 'status',
    header: sortable(query, 'employmentStatus', 'Status'),
    cell: (row) => (
      <Badge tone={row.employmentStatus === 'active' ? 'green' : 'slate'}>
        {row.employmentStatus}
      </Badge>
    ),
  },
  {
    key: 'pay',
    header: 'Current pay',
    cell: (row) =>
      row.currentCompensation ? (
        formatPay(
          row.currentCompensation.amount,
          row.currentCompensation.currencyCode,
          row.currentCompensation.payFrequency,
        )
      ) : (
        <span className="text-slate-400">Not set</span>
      ),
  },
];

const EmployeesPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<RawSearchParams>;
}) => {
  const query = parseDirectoryQuery(await searchParams);
  const [list, facets] = await Promise.all([
    serverGet<EmployeeSummaryDto[]>(`/employees?${toQueryString(query)}`),
    serverData<EmployeeFacetsDto>('/employees/facets'),
  ]);
  const meta = list.meta ?? { page: 1, limit: 25, total: list.data.length };

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${meta.total.toLocaleString('en')} employees`}
        actions={<LinkButton href="/employees/new">Add employee</LinkButton>}
      />
      <DirectoryFilters query={query} facets={facets} />
      <Card className="overflow-x-auto p-0 [&>div]:p-0">
        <DataTable
          className={TABLE_CLASS}
          columns={columnsFor(query)}
          data={list.data}
          keyExtractor={(row) => row.id}
          empty={
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              No employees match these filters.
            </p>
          }
        />
      </Card>
      <Pagination
        meta={meta}
        label="Employees"
        hrefFor={(page) => directoryHref(query, { page })}
      />
    </>
  );
};

export default EmployeesPage;
