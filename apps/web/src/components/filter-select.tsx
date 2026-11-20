const CONTROL =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

export const plainOptions = (values: readonly string[]): readonly FilterOption[] =>
  values.map((value) => ({ value, label: value }));

export const FilterSelect = ({
  name,
  label,
  value,
  options,
  allLabel = 'All',
}: {
  readonly name: string;
  readonly label: string;
  readonly value: string | undefined;
  readonly options: readonly FilterOption[];
  readonly allLabel?: string | null;
}) => (
  <label className="block text-xs font-medium text-slate-600">
    {label}
    <select name={name} defaultValue={value ?? ''} className={CONTROL}>
      {allLabel === null ? null : <option value="">{allLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const FILTER_INPUT_CLASS = CONTROL;
