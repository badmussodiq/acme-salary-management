export interface BarItem {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

export const REMAINDER_KEY = '__remainder__';

export const scaleOf = (items: readonly BarItem[]): number =>
  Math.max(0, ...items.filter((item) => item.key !== REMAINDER_KEY).map((item) => item.value));

export const topWithRemainder = (
  items: readonly BarItem[],
  limit: number,
  remainderLabel: (count: number) => string,
): readonly BarItem[] => {
  if (items.length <= limit) return items;
  const shown = items.slice(0, limit);
  const rest = items.slice(limit);
  const remainder: BarItem = {
    key: REMAINDER_KEY,
    label: remainderLabel(rest.length),
    value: rest.reduce((sum, item) => sum + item.value, 0),
  };
  return [...shown, remainder];
};
