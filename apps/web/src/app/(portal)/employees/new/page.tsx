import type { EmployeeFacetsDto } from '@acme/contracts';
import { PageHeader } from '@/components/ui';
import { serverData } from '@/lib/server-api';
import { CreateEmployeeForm } from './create-employee-form';

const NewEmployeePage = async () => {
  const facets = await serverData<EmployeeFacetsDto>('/employees/facets');

  return (
    <>
      <PageHeader
        title="Add employee"
        subtitle="Create the employee and their first compensation record."
      />
      <CreateEmployeeForm departments={facets.departments} jobTitles={facets.jobTitles} />
    </>
  );
};

export default NewEmployeePage;
