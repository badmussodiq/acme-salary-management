import type { JsonValue } from '@acme/contracts';

export const compensationSnapshot = (compensation: {
  readonly amount: string;
  readonly currency_code: string;
  readonly pay_frequency: string;
  readonly effective_from: string;
  readonly effective_to: string | null;
}): JsonValue => ({
  amount: compensation.amount,
  currencyCode: compensation.currency_code,
  payFrequency: compensation.pay_frequency,
  effectiveFrom: compensation.effective_from,
  effectiveTo: compensation.effective_to,
});
