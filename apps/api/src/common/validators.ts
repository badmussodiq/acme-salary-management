import { Transform } from 'class-transformer';
import { registerDecorator, type ValidationOptions } from 'class-validator';
import { ISO_DATE_PATTERN, MONEY_PATTERN } from '@acme/contracts';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export const isCalendarDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  const year = parsed.getUTCFullYear();
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().startsWith(value) &&
    year >= MIN_YEAR &&
    year <= MAX_YEAR
  );
};

export const isPositiveMoney = (value: unknown): value is string =>
  typeof value === 'string' && MONEY_PATTERN.test(value) && Number(value) > 0;

const customRule =
  (name: string, test: (value: unknown) => boolean, message: (property: string) => string) =>
  (options?: ValidationOptions) =>
  (target: object, propertyName: string): void => {
    registerDecorator({
      name,
      target: target.constructor,
      propertyName,
      ...(options ? { options } : {}),
      validator: {
        validate: test,
        defaultMessage: (args) => message(args?.property ?? 'value'),
      },
    });
  };

export const IsCalendarDate = customRule(
  'isCalendarDate',
  isCalendarDate,
  (property) => `${property} must be a valid date in YYYY-MM-DD format`,
);

export const IsPositiveMoney = customRule(
  'isPositiveMoney',
  isPositiveMoney,
  (property) => `${property} must be a positive amount with at most 2 decimal places`,
);

export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export const Lowercase = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

export const NAME_PATTERN = /^[\p{L}][\p{L}\p{M} .'’-]*$/u;
export const LABEL_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\p{M} &/.,'’()-]*$/u;
