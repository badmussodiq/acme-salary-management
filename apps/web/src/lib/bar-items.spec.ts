import { describe, expect, it } from 'vitest';
import { scaleOf, topWithRemainder, type BarItem } from './bar-items';

const items: readonly BarItem[] = [
  { key: 'a', label: 'A', value: 50 },
  { key: 'b', label: 'B', value: 30 },
  { key: 'c', label: 'C', value: 12 },
  { key: 'd', label: 'D', value: 5 },
  { key: 'e', label: 'E', value: 3 },
];

describe('topWithRemainder', () => {
  it('keeps everything when it already fits', () => {
    expect(topWithRemainder(items, 5, () => 'rest')).toBe(items);
    expect(topWithRemainder(items, 10, () => 'rest')).toBe(items);
  });

  it('folds the smallest entries into one labelled remainder that keeps the total', () => {
    const result = topWithRemainder(items, 3, (count) => `${count} others`);

    expect(result.map((item) => item.label)).toEqual(['A', 'B', 'C', '2 others']);
    expect(result.at(-1)?.value).toBe(8);
    expect(result.reduce((sum, item) => sum + item.value, 0)).toBe(100);
  });

  it('handles an empty list', () => {
    expect(topWithRemainder([], 3, () => 'rest')).toEqual([]);
  });
});

describe('scaleOf', () => {
  it('ignores the combined remainder so individual bars stay readable', () => {
    const result = topWithRemainder(items, 3, (count) => `${count} others`);

    expect(scaleOf(result)).toBe(50);
    expect(scaleOf([])).toBe(0);
  });
});
