export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export const COUNTRY_CODES: readonly CountryCode[] = COUNTRIES.map((country) => country.code);

export const CURRENCY_CODES = [
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'EGP',
  'USD',
  'CAD',
  'GBP',
  'EUR',
  'INR',
  'SGD',
  'AED',
  'AUD',
  'BRL',
  'JPY',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const PAY_FREQUENCIES = ['annual', 'monthly', 'hourly'] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export const EMPLOYMENT_STATUSES = ['active', 'inactive'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const USER_ROLES = ['hr_manager'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUDIT_ACTIONS = [
  'employee.created',
  'employee.updated',
  'compensation.added',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const MONEY_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isCountryCode = (value: unknown): value is CountryCode =>
  COUNTRY_CODES.some((code) => code === value);

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  CURRENCY_CODES.some((code) => code === value);

export type JsonValue =
  string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };
