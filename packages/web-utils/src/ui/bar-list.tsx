import type { ReactNode } from 'react';
import { Mapping } from './mapping';

export interface BarListProps<T> {
  readonly items: readonly T[];
  readonly label: (item: T) => ReactNode;
  readonly value: (item: T) => number;
  readonly keyExtractor: (item: T) => string;
  readonly formatValue?: (value: number) => string;
  readonly empty?: ReactNode;
  readonly className?: string;
  readonly scaleTo?: number;
}

export const barWidthPercent = (value: number, maximum: number): number =>
  maximum <= 0 ? 0 : Math.min(100, Math.max(2, Math.round((value / maximum) * 100)));

export const BarList = <T,>({
  items,
  label,
  value,
  keyExtractor,
  formatValue = (amount) => amount.toLocaleString('en'),
  empty,
  className,
  scaleTo,
}: BarListProps<T>) => {
  const maximum = scaleTo ?? Math.max(0, ...items.map(value));

  return (
    <ul className={className}>
      <Mapping array={items} keyExtractor={keyExtractor} empty={empty}>
        {(item) => {
          const amount = value(item);
          return (
            <li className="grid grid-cols-[minmax(7rem,12rem)_1fr_auto] items-center gap-3 py-1">
              <span className="truncate text-sm text-slate-700">{label(item)}</span>
              <span className="h-2 rounded-full bg-slate-100" aria-hidden="true">
                <span
                  className="block h-2 rounded-full bg-brand-600"
                  style={{ width: `${barWidthPercent(amount, maximum)}%` }}
                />
              </span>
              <span className="text-sm tabular-nums text-slate-900">{formatValue(amount)}</span>
            </li>
          );
        }}
      </Mapping>
    </ul>
  );
};
