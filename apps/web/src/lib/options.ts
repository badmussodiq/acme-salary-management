import {
  COUNTRIES,
  CURRENCY_CODES,
  CURRENCY_NAMES,
  EMPLOYMENT_STATUSES,
  PAY_FREQUENCIES,
  type CountryCode,
  type CurrencyCode,
  type EmploymentStatus,
  type PayFrequency,
} from '@acme/contracts';

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

const capitalise = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export const COUNTRY_OPTIONS: readonly Option<CountryCode>[] = COUNTRIES.map((country) => ({
  value: country.code,
  label: `${country.name} (${country.code})`,
}));

export const CURRENCY_OPTIONS: readonly Option<CurrencyCode>[] = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${code} · ${CURRENCY_NAMES[code]}`,
}));

export const FREQUENCY_OPTIONS: readonly Option<PayFrequency>[] = PAY_FREQUENCIES.map((value) => ({
  value,
  label: capitalise(value),
}));

export const STATUS_OPTIONS: readonly Option<EmploymentStatus>[] = EMPLOYMENT_STATUSES.map(
  (value) => ({ value, label: capitalise(value) }),
);
