import type { EmployeeDetailDto, EmployeeFacetsDto } from '@acme/contracts';
import { PageHeader } from '@/components/ui';
import { fullName } from '@/lib/format';
import { serverData } from '@/lib/server-api';
import { EditEmployeeForm } from './edit-employee-form';

const EditEmployeePage = async ({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) => {
  const { id } = await params;
  const [employee, facets] = await Promise.all([
    serverData<EmployeeDetailDto>(`/employees/${id}`),
    serverData<EmployeeFacetsDto>('/employees/facets'),
  ]);

  return (
    <>
      <PageHeader title={`Edit ${fullName(employee)}`} subtitle={employee.employeeNumber} />
      <EditEmployeeForm
        employee={employee}
        departments={facets.departments}
        jobTitles={facets.jobTitles}
      />
    </>
  );
};

export default EditEmployeePage;
