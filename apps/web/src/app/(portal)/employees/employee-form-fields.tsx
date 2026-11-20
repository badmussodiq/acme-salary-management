'use client';

import type { CountryCode, EmploymentStatus } from '@acme/contracts';
import type { FieldBinding } from '@acme/web-utils';
import { SelectField, TextField } from '@/components/form-fields';
import { COUNTRY_OPTIONS, STATUS_OPTIONS } from '@/lib/options';

export interface EmployeeProfileBindings {
  readonly firstName: FieldBinding<string>;
  readonly lastName: FieldBinding<string>;
  readonly email: FieldBinding<string>;
  readonly countryCode: FieldBinding<CountryCode>;
  readonly department: FieldBinding<string>;
  readonly jobTitle: FieldBinding<string>;
  readonly employmentStatus: FieldBinding<EmploymentStatus>;
}

export const EmployeeProfileFields = ({
  bindings,
  errors,
  departments,
  jobTitles,
}: {
  readonly bindings: EmployeeProfileBindings;
  readonly errors: Readonly<Record<string, string>>;
  readonly departments: readonly string[];
  readonly jobTitles: readonly string[];
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <TextField
      label="First name"
      binding={bindings.firstName}
      error={errors['firstName']}
      maxLength={100}
    />
    <TextField
      label="Last name"
      binding={bindings.lastName}
      error={errors['lastName']}
      maxLength={100}
    />
    <TextField
      label="Work email"
      type="email"
      binding={bindings.email}
      error={errors['email']}
      maxLength={254}
    />
    <SelectField
      label="Country"
      binding={bindings.countryCode}
      options={COUNTRY_OPTIONS}
      error={errors['countryCode']}
    />
    <TextField
      label="Department"
      binding={bindings.department}
      error={errors['department']}
      suggestions={departments}
      maxLength={100}
    />
    <TextField
      label="Job title"
      binding={bindings.jobTitle}
      error={errors['jobTitle']}
      suggestions={jobTitles}
      maxLength={100}
    />
    <SelectField
      label="Employment status"
      binding={bindings.employmentStatus}
      options={STATUS_OPTIONS}
      error={errors['employmentStatus']}
    />
  </div>
);
