import { COUNTRIES, type CountryCode, type CurrencyCode, type PayFrequency } from '@acme/contracts';

const FREQUENCY_SUFFIX: Readonly<Record<PayFrequency, string>> = {
  annual: '/ yr',
  monthly: '/ mo',
  hourly: '/ hr',
};

export const countryName = (code: CountryCode): string =>
  COUNTRIES.find((country) => country.code === code)?.name ?? code;

export const formatMoney = (amount: string, currency: CurrencyCode): string => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};

export const formatPay = (
  amount: string,
  currency: CurrencyCode,
  frequency: PayFrequency,
): string => `${formatMoney(amount, currency)} ${FREQUENCY_SUFFIX[frequency]}`;

export const formatDate = (isoDate: string): string => {
  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? isoDate
    : parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
};

export const formatDateTime = (isoTimestamp: string): string => {
  const parsed = new Date(isoTimestamp);
  return Number.isNaN(parsed.getTime())
    ? isoTimestamp
    : parsed.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
};

export const fullName = (employee: { firstName: string; lastName: string }): string =>
  `${employee.firstName} ${employee.lastName}`;
