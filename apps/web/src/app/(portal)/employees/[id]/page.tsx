import type {
  AuditEventDto,
  CompensationDto,
  EmployeeDetailDto,
  FeaturesDto,
} from '@acme/contracts';
import { currencyOfCountry } from '@acme/contracts';
import { redirect } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@acme/web-utils';
import { Avatar } from '@/components/avatar';
import { Pagination } from '@/components/pagination';
import { Badge, Card, LinkButton, PageHeader, TABLE_CLASS } from '@/components/ui';
import { AUDIT_ACTION_LABELS, describeAuditEvent } from '@/lib/audit';
import { countryName, formatDate, formatDateTime, formatPay, fullName } from '@/lib/format';
import { pageFrom } from '@/lib/pagination';
import type { RawSearchParams } from '@/lib/directory-query';
import { serverData, serverGet } from '@/lib/server-api';
import { AddCompensationForm } from './add-compensation-form';
import { AvatarUpload } from './avatar-upload';

const AUDIT_PAGE_SIZE = 10;

const compensationColumns: readonly DataTableColumn<CompensationDto>[] = [
  {
    key: 'pay',
    header: 'Pay',
    cell: (row) => formatPay(row.amount, row.currencyCode, row.payFrequency),
  },
  { key: 'from', header: 'Effective from', cell: (row) => formatDate(row.effectiveFrom) },
  {
    key: 'to',
    header: 'Effective to',
    cell: (row) =>
      row.effectiveTo ? formatDate(row.effectiveTo) : <Badge tone="green">Current</Badge>,
  },
];

const auditColumns: readonly DataTableColumn<AuditEventDto>[] = [
  { key: 'when', header: 'When (UTC)', cell: (row) => formatDateTime(row.createdAt) },
  { key: 'who', header: 'By', cell: (row) => row.actorEmail ?? 'System' },
  { key: 'action', header: 'Action', cell: (row) => AUDIT_ACTION_LABELS[row.action] },
  {
    key: 'details',
    header: 'Details',
    cell: (row) => <span className="whitespace-normal">{describeAuditEvent(row)}</span>,
  },
];

const Detail = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
  </div>
);

const EmployeePage = async ({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<RawSearchParams>;
}) => {
  const { id } = await params;
  const auditPage = pageFrom((await searchParams)['auditPage']);
  const [employee, history, audit, features] = await Promise.all([
    serverData<EmployeeDetailDto>(`/employees/${id}`),
    serverData<CompensationDto[]>(`/employees/${id}/compensation`),
    serverGet<AuditEventDto[]>(`/employees/${id}/audit?limit=${AUDIT_PAGE_SIZE}&page=${auditPage}`),
    serverData<FeaturesDto>('/features'),
  ]);
  if (auditPage > 1 && audit.data.length === 0) redirect(`/employees/${id}`);
  const current = employee.currentCompensation;

  return (
    <>
      <PageHeader
        title={fullName(employee)}
        subtitle={`${employee.employeeNumber} · ${employee.jobTitle}`}
        actions={
          <LinkButton href={`/employees/${employee.id}/edit`} variant="secondary">
            Edit details
          </LinkButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Profile" className="lg:col-span-2">
          <div className="mb-5">
            <Avatar employee={employee} size="lg" />
            {features.profilePictures && (
              <AvatarUpload employeeId={employee.id} hasAvatar={employee.avatarUrl !== null} />
            )}
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Email" value={employee.email} />
            <Detail label="Country" value={countryName(employee.countryCode)} />
            <Detail label="Department" value={employee.department} />
            <Detail label="Job title" value={employee.jobTitle} />
            <Detail label="Hired" value={formatDate(employee.hiredOn)} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-1">
                <Badge tone={employee.employmentStatus === 'active' ? 'green' : 'slate'}>
                  {employee.employmentStatus}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>
        <Card title="Current compensation">
          {current ? (
            <>
              <p className="text-2xl font-semibold tracking-tight">
                {formatPay(current.amount, current.currencyCode, current.payFrequency)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Since {formatDate(current.effectiveFrom)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No compensation is in effect today.</p>
          )}
        </Card>
        <Card title="Compensation history" className="overflow-x-auto lg:col-span-2">
          <DataTable
            className={TABLE_CLASS}
            columns={compensationColumns}
            data={history}
            keyExtractor={(row) => row.id}
            empty={<p className="text-sm text-slate-500">No compensation records yet.</p>}
          />
        </Card>
        <Card title="Add compensation">
          <AddCompensationForm
            employeeId={employee.id}
            defaultCurrency={current?.currencyCode ?? currencyOfCountry(employee.countryCode)}
            defaultFrequency={current?.payFrequency ?? 'annual'}
          />
        </Card>
        <Card title="Audit trail" className="overflow-x-auto lg:col-span-3">
          <DataTable
            className={TABLE_CLASS}
            columns={auditColumns}
            data={audit.data}
            keyExtractor={(row) => row.id}
            empty={<p className="text-sm text-slate-500">No changes recorded.</p>}
          />
          {audit.meta ? (
            <Pagination
              meta={audit.meta}
              label="Audit trail"
              hrefFor={(page) =>
                page > 1 ? `/employees/${id}?auditPage=${page}` : `/employees/${id}`
              }
            />
          ) : null}
        </Card>
      </div>
    </>
  );
};

export default EmployeePage;
