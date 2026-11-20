'use client';

import { useRouter } from 'next/navigation';
import type {
  CompensationDto,
  CompensationInput,
  CurrencyCode,
  PayFrequency,
} from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { Button } from '@/components/ui';
import { CompensationFields } from '../compensation-fields';

interface CompensationForm {
  amount: string;
  currencyCode: CurrencyCode;
  payFrequency: PayFrequency;
  effectiveFrom: string;
}

export const AddCompensationForm = ({
  employeeId,
  defaultCurrency,
  defaultFrequency,
}: {
  readonly employeeId: string;
  readonly defaultCurrency: CurrencyCode;
  readonly defaultFrequency: PayFrequency;
}) => {
  const router = useRouter();
  const initial: CompensationForm = {
    amount: '',
    currencyCode: defaultCurrency,
    payFrequency: defaultFrequency,
    effectiveFrom: '',
  };
  const { values, bind, reset } = useFormFields(initial);
  const { run, pending, fieldErrors } = useApiAction<CompensationDto, CompensationInput>(
    `/api/v1/employees/${employeeId}/compensation`,
    {
      successMessage: 'Compensation added',
      onSuccess: () => {
        reset();
        router.refresh();
      },
    },
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void run(values);
      }}
    >
      <CompensationFields
        errors={fieldErrors}
        bindings={{
          amount: bind('amount'),
          currencyCode: bind('currencyCode'),
          payFrequency: bind('payFrequency'),
          effectiveFrom: bind('effectiveFrom'),
        }}
      />
      <p className="text-xs text-slate-500">
        The new amount starts on the effective date and closes the current period.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Add compensation'}
      </Button>
    </form>
  );
};
