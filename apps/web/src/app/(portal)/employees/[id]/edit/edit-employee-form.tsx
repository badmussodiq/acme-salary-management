'use client';

import { useRouter } from 'next/navigation';
import type {
  CountryCode,
  EmployeeDetailDto,
  EmploymentStatus,
  UpdateEmployeeRequest,
} from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { Button, Card, LinkButton } from '@/components/ui';
import { EmployeeProfileFields } from '../../employee-form-fields';

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: CountryCode;
  department: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
}

export const EditEmployeeForm = ({
  employee,
  departments,
  jobTitles,
}: {
  readonly employee: EmployeeDetailDto;
  readonly departments: readonly string[];
  readonly jobTitles: readonly string[];
}) => {
  const router = useRouter();
  const { values, bind } = useFormFields<EditForm>({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    countryCode: employee.countryCode,
    department: employee.department,
    jobTitle: employee.jobTitle,
    employmentStatus: employee.employmentStatus,
  });
  const { run, pending, fieldErrors } = useApiAction<EmployeeDetailDto, UpdateEmployeeRequest>(
    `/api/v1/employees/${employee.id}`,
    {
      method: 'PATCH',
      successMessage: 'Employee updated',
      onSuccess: () => {
        router.push(`/employees/${employee.id}`);
        router.refresh();
      },
    },
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void run({ version: employee.version, ...values });
      }}
    >
      <Card title="Employee">
        <EmployeeProfileFields
          bindings={{
            firstName: bind('firstName'),
            lastName: bind('lastName'),
            email: bind('email'),
            countryCode: bind('countryCode'),
            department: bind('department'),
            jobTitle: bind('jobTitle'),
            employmentStatus: bind('employmentStatus'),
          }}
          errors={fieldErrors}
          departments={departments}
          jobTitles={jobTitles}
        />
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        <LinkButton href={`/employees/${employee.id}`} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
};
