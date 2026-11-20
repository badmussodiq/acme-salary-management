'use client';

import type { CurrencyCode, PayFrequency } from '@acme/contracts';
import type { FieldBinding } from '@acme/web-utils';
import { SelectField, TextField } from '@/components/form-fields';
import { CURRENCY_OPTIONS, FREQUENCY_OPTIONS } from '@/lib/options';

export interface CompensationBindings {
  readonly amount: FieldBinding<string>;
  readonly currencyCode: FieldBinding<CurrencyCode>;
  readonly payFrequency: FieldBinding<PayFrequency>;
  readonly effectiveFrom: FieldBinding<string>;
}

export const CompensationFields = ({
  bindings,
  errors,
  prefix = '',
}: {
  readonly bindings: CompensationBindings;
  readonly errors: Readonly<Record<string, string>>;
  readonly prefix?: string;
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <TextField
      label="Amount"
      binding={bindings.amount}
      error={errors[`${prefix}amount`]}
      hint="Numbers only, up to 2 decimal places"
      placeholder="85000.00"
    />
    <SelectField
      label="Currency"
      binding={bindings.currencyCode}
      options={CURRENCY_OPTIONS}
      error={errors[`${prefix}currencyCode`]}
    />
    <SelectField
      label="Pay frequency"
      binding={bindings.payFrequency}
      options={FREQUENCY_OPTIONS}
      error={errors[`${prefix}payFrequency`]}
    />
    <TextField
      label="Effective from"
      type="date"
      binding={bindings.effectiveFrom}
      error={errors[`${prefix}effectiveFrom`]}
    />
  </div>
);
