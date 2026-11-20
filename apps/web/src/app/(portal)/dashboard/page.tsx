import Link from 'next/link';
import type {
  DataQualityDto,
  DistributionRowDto,
  EmployeeFacetsDto,
  OutlierDto,
  OverviewDto,
} from '@acme/contracts';
import { BarList, DataTable, type DataTableColumn } from '@acme/web-utils';
import { Pagination } from '@/components/pagination';
import { Card, PageHeader, TABLE_CLASS } from '@/components/ui';
import { scaleOf, topWithRemainder, type BarItem } from '@/lib/bar-items';
import {
  SUMMARY_PAGE_SIZE,
  dashboardHref,
  distributionQueryString,
  parseDashboardFilters,
  toDistributionQuery,
} from '@/lib/dashboard-query';
import type { RawSearchParams } from '@/lib/directory-query';
import { countryName, formatMoney, formatPay } from '@/lib/format';
import { paginate } from '@/lib/pagination';
import { redirect } from 'next/navigation';
import { serverData } from '@/lib/server-api';
import { DashboardFilters } from './dashboard-filters';

const FREQUENCY_LABEL = { annual: 'per year', monthly: 'per month', hourly: 'per hour' } as const;

const Stat = ({
  label,
  value,
  href,
}: {
  readonly label: string;
  readonly value: number;
  readonly href?: string;
}) => {
  const content = (
    <>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {value.toLocaleString('en')}
      </dd>
    </>
  );
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {href ? (
        <Link href={href} className="block hover:text-brand-700">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};

const groupLabel = (grouping: string, group: string | null): string => {
  if (group === null) return 'All employees';
  return grouping === 'countryCode' ? countryName(group) : group;
};

const barLabel = (item: BarItem): string => item.label;
const barValue = (item: BarItem): number => item.value;
const barKey = (item: BarItem): string => item.key;

const outlierColumns: readonly DataTableColumn<OutlierDto>[] = [
  {
    key: 'name',
    header: 'Employee',
    cell: (row) => (
      <Link
        href={`/employees/${row.employeeId}`}
        className="font-medium text-brand-700 hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  { key: 'title', header: 'Job title', cell: (row) => row.jobTitle },
  {
    key: 'pay',
    header: 'Current pay',
    cell: (row) => formatPay(row.amount, row.currencyCode, row.payFrequency),
  },
  {
    key: 'median',
    header: 'Median for role',
    cell: (row) => formatPay(row.groupMedian, row.currencyCode, row.payFrequency),
  },
];

const DashboardPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<RawSearchParams>;
}) => {
  const filters = parseDashboardFilters(await searchParams);
  const query = toDistributionQuery(filters);
  const [overview, distribution, quality, facets] = await Promise.all([
    serverData<OverviewDto>('/insights/overview'),
    serverData<DistributionRowDto[]>(
      `/insights/salary-distribution?${distributionQueryString(query)}`,
    ),
    serverData<DataQualityDto>(`/insights/data-quality?page=${filters.outlierPage}`),
    serverData<EmployeeFacetsDto>('/employees/facets'),
  ]);

  const rows = distribution.toSorted((a, b) => b.headcount - a.headcount);
  const summary = paginate(rows, filters.summaryPage, SUMMARY_PAGE_SIZE);
  if (filters.outlierPage > 1 && quality.outliers.length === 0) {
    redirect(dashboardHref(filters, { outlierPage: 1 }));
  }

  const countryBars = topWithRemainder(
    overview.byCountry.map((entry) => ({
      key: entry.key,
      label: countryName(entry.key),
      value: entry.headcount,
    })),
    10,
    (count) => `${count} other countries`,
  );
  const payMixBars = topWithRemainder(
    overview.payMix.map((entry) => ({
      key: `${entry.currencyCode}-${entry.payFrequency}`,
      label: `${entry.currencyCode} · ${FREQUENCY_LABEL[entry.payFrequency]}`,
      value: entry.headcount,
    })),
    10,
    (count) => `${count} other currency and frequency combinations`,
  );

  const distributionColumns: readonly DataTableColumn<DistributionRowDto>[] = [
    {
      key: 'group',
      header: 'Group',
      cell: (row) => groupLabel(filters.groupBy, row.group),
    },
    { key: 'currency', header: 'Currency', cell: (row) => row.currencyCode },
    { key: 'frequency', header: 'Paid', cell: (row) => FREQUENCY_LABEL[row.payFrequency] },
    { key: 'headcount', header: 'Headcount', cell: (row) => row.headcount.toLocaleString('en') },
    { key: 'min', header: 'Minimum', cell: (row) => formatMoney(row.minimum, row.currencyCode) },
    { key: 'median', header: 'Median', cell: (row) => formatMoney(row.median, row.currencyCode) },
    { key: 'avg', header: 'Average', cell: (row) => formatMoney(row.average, row.currencyCode) },
    { key: 'max', header: 'Maximum', cell: (row) => formatMoney(row.maximum, row.currencyCode) },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="How ACME pays its people" />

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Employees" value={overview.totalEmployees} href="/employees" />
        <Stat
          label="Active"
          value={overview.activeEmployees}
          href="/employees?employmentStatus=active"
        />
        <Stat
          label="Inactive"
          value={overview.inactiveEmployees}
          href="/employees?employmentStatus=inactive"
        />
        <Stat
          label="Without current pay"
          value={overview.withoutCurrentCompensation}
          href="/employees?compensation=missing"
        />
      </dl>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Headcount by country">
          <BarList
            items={countryBars}
            scaleTo={scaleOf(countryBars)}
            label={barLabel}
            value={barValue}
            keyExtractor={barKey}
            empty={<li className="text-sm text-slate-500">No employees yet.</li>}
          />
        </Card>
        <Card title="Headcount by department">
          <BarList
            items={overview.byDepartment}
            label={(entry) => entry.key}
            value={(entry) => entry.headcount}
            keyExtractor={(entry) => entry.key}
            empty={<li className="text-sm text-slate-500">No employees yet.</li>}
          />
        </Card>
        <Card title="Pay currency and frequency">
          <BarList
            items={payMixBars}
            scaleTo={scaleOf(payMixBars)}
            label={barLabel}
            value={barValue}
            keyExtractor={barKey}
            empty={<li className="text-sm text-slate-500">No compensation yet.</li>}
          />
        </Card>
      </div>

      <Card title="Salary summary" className="mb-6">
        <DashboardFilters filters={filters} facets={facets} />
        <p className="mb-3 text-xs text-slate-500">
          Amounts are never converted or combined across currencies or pay frequencies: each row is
          one currency paid at one frequency.
        </p>
        <div className="overflow-x-auto">
          <DataTable
            className={TABLE_CLASS}
            columns={distributionColumns}
            data={summary.items}
            keyExtractor={(row) => `${row.group ?? 'all'}-${row.currencyCode}-${row.payFrequency}`}
            empty={
              <p className="py-6 text-center text-sm text-slate-500">
                No compensation matches these filters.
              </p>
            }
          />
        </div>
        <Pagination
          meta={summary.meta}
          label="Salary summary"
          hrefFor={(page) => dashboardHref(filters, { summaryPage: page })}
        />
      </Card>

      <Card title="Data quality">
        <ul className="mb-4 space-y-2 text-sm">
          <li>
            <Link
              href="/employees?compensation=missing&employmentStatus=active"
              className="text-brand-700 hover:underline"
            >
              {quality.activeWithoutCompensation.toLocaleString('en')} active employees
            </Link>{' '}
            have no compensation in effect.
          </li>
          <li>
            <Link
              href="/employees?compensation=present&employmentStatus=inactive"
              className="text-brand-700 hover:underline"
            >
              {quality.inactiveWithCurrentCompensation.toLocaleString('en')} inactive employees
            </Link>{' '}
            still have current compensation.
          </li>
          <li>
            {quality.outlierCount.toLocaleString('en')} active employees are paid more than 3× or
            less than a third of the median for their role, currency and frequency .
          </li>
        </ul>
        <div className="overflow-x-auto">
          <DataTable
            className={TABLE_CLASS}
            columns={outlierColumns}
            data={quality.outliers}
            keyExtractor={(row) => row.employeeId}
            empty={<p className="text-sm text-slate-500">No unusual pay found.</p>}
          />
        </div>
        <Pagination
          meta={quality.outlierMeta}
          label="Unusual salaries"
          hrefFor={(page) => dashboardHref(filters, { outlierPage: page })}
        />
      </Card>
    </>
  );
};

export default DashboardPage;
