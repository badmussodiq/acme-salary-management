'use client';

import { useId, type HTMLInputTypeAttribute } from 'react';
import type { FieldBinding } from '@acme/web-utils';
import type { Option } from '@/lib/options';

const INPUT_CLASS =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 aria-[invalid=true]:border-red-500';

const Field = ({
  id,
  label,
  error,
  hint,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly error: string | undefined;
  readonly hint?: string;
  readonly children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
    {hint && !error ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    {error ? (
      <p role="alert" className="mt-1 text-xs text-red-600">
        {error}
      </p>
    ) : null}
  </div>
);

export const TextField = ({
  label,
  binding,
  type = 'text',
  error,
  hint,
  suggestions,
  placeholder,
  autoComplete,
  maxLength,
}: {
  readonly label: string;
  readonly binding: FieldBinding<string>;
  readonly type?: HTMLInputTypeAttribute;
  readonly error?: string | undefined;
  readonly hint?: string;
  readonly suggestions?: readonly string[];
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly maxLength?: number;
}) => {
  const id = useId();
  const listId = `${id}-list`;
  return (
    <Field id={id} label={label} error={error} {...(hint ? { hint } : {})}>
      <input
        id={id}
        type={type}
        value={binding.value}
        onChange={(event) => {
          binding.onChange(event.target.value);
        }}
        aria-invalid={error ? true : undefined}
        className={INPUT_CLASS}
        list={suggestions ? listId : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
      />
      {suggestions ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </Field>
  );
};

export const SelectField = <T extends string>({
  label,
  binding,
  options,
  error,
}: {
  readonly label: string;
  readonly binding: FieldBinding<T>;
  readonly options: readonly Option<T>[];
  readonly error?: string | undefined;
}) => {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <select
        id={id}
        value={binding.value}
        onChange={(event) => {
          const match = options.find((option) => option.value === event.target.value);
          if (match) binding.onChange(match.value);
        }}
        aria-invalid={error ? true : undefined}
        className={INPUT_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
};
