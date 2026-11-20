'use client';

import { useRouter } from 'next/navigation';
import type {
  CountryCode,
  CreateEmployeeRequest,
  CurrencyCode,
  EmployeeDetailDto,
  EmploymentStatus,
  PayFrequency,
} from '@acme/contracts';
import { currencyOfCountry } from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { TextField } from '@/components/form-fields';
import { Button, Card, LinkButton } from '@/components/ui';
import { CompensationFields } from '../compensation-fields';
import { EmployeeProfileFields } from '../employee-form-fields';

interface CreateEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: CountryCode;
  department: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
  hiredOn: string;
  amount: string;
  currencyCode: CurrencyCode;
  payFrequency: PayFrequency;
  effectiveFrom: string;
}

const INITIAL: CreateEmployeeForm = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: 'NG',
  department: '',
  jobTitle: '',
  employmentStatus: 'active',
  hiredOn: '',
  amount: '',
  currencyCode: 'NGN',
  payFrequency: 'annual',
  effectiveFrom: '',
};

const toRequest = (form: CreateEmployeeForm): CreateEmployeeRequest => ({
  firstName: form.firstName,
  lastName: form.lastName,
  email: form.email,
  countryCode: form.countryCode,
  department: form.department,
  jobTitle: form.jobTitle,
  hiredOn: form.hiredOn,
  employmentStatus: form.employmentStatus,
  compensation: {
    amount: form.amount,
    currencyCode: form.currencyCode,
    payFrequency: form.payFrequency,
    effectiveFrom: form.effectiveFrom,
  },
});

export const CreateEmployeeForm = ({
  departments,
  jobTitles,
}: {
  readonly departments: readonly string[];
  readonly jobTitles: readonly string[];
}) => {
  const router = useRouter();
  const { values, bind, patch } = useFormFields(INITIAL);
  const countryBinding = {
    value: values.countryCode,
    onChange: (countryCode: CountryCode) => {
      patch({ countryCode, currencyCode: currencyOfCountry(countryCode) });
    },
  };
  const { run, pending, fieldErrors } = useApiAction<EmployeeDetailDto, CreateEmployeeRequest>(
    '/api/v1/employees',
    {
      successMessage: 'Employee created',
      onSuccess: (employee) => {
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
        void run(toRequest(values));
      }}
    >
      <Card title="Employee">
        <div className="space-y-4">
          <EmployeeProfileFields
            bindings={{
              firstName: bind('firstName'),
              lastName: bind('lastName'),
              email: bind('email'),
              countryCode: countryBinding,
              department: bind('department'),
              jobTitle: bind('jobTitle'),
              employmentStatus: bind('employmentStatus'),
            }}
            errors={fieldErrors}
            departments={departments}
            jobTitles={jobTitles}
          />
          <div className="sm:w-1/2">
            <TextField
              label="Hire date"
              type="date"
              binding={bind('hiredOn')}
              error={fieldErrors['hiredOn']}
            />
          </div>
        </div>
      </Card>
      <Card title="Initial compensation">
        <CompensationFields
          prefix="compensation."
          errors={fieldErrors}
          bindings={{
            amount: bind('amount'),
            currencyCode: bind('currencyCode'),
            payFrequency: bind('payFrequency'),
            effectiveFrom: bind('effectiveFrom'),
          }}
        />
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create employee'}
        </Button>
        <LinkButton href="/employees" variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
};
