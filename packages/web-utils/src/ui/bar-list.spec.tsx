import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BarList, barWidthPercent } from './bar-list';

interface Row {
  readonly name: string;
  readonly total: number;
}

const rows: readonly Row[] = [
  { name: 'Nigeria', total: 400 },
  { name: 'Ghana', total: 100 },
];

describe('barWidthPercent', () => {
  it('scales against the maximum and never disappears', () => {
    expect(barWidthPercent(400, 400)).toBe(100);
    expect(barWidthPercent(100, 400)).toBe(25);
    expect(barWidthPercent(1, 400)).toBe(2);
  });

  it('is zero when there is nothing to compare', () => {
    expect(barWidthPercent(0, 0)).toBe(0);
  });
});

describe('BarList', () => {
  it('renders a labelled, formatted row per item with proportional bars', () => {
    const html = renderToStaticMarkup(
      <BarList
        items={rows}
        label={(row) => row.name}
        value={(row) => row.total}
        keyExtractor={(row) => row.name}
      />,
    );

    expect(html).toContain('Nigeria');
    expect(html).toContain('400');
    expect(html).toContain('width:100%');
    expect(html).toContain('width:25%');
  });

  it('uses a custom value formatter', () => {
    const html = renderToStaticMarkup(
      <BarList
        items={rows}
        label={(row) => row.name}
        value={(row) => row.total}
        keyExtractor={(row) => row.name}
        formatValue={(value) => `${value} people`}
      />,
    );

    expect(html).toContain('400 people');
  });

  it('shows the empty state', () => {
    const html = renderToStaticMarkup(
      <BarList
        items={[]}
        label={(row: Row) => row.name}
        value={(row: Row) => row.total}
        keyExtractor={(row: Row) => row.name}
        empty={<li>No data</li>}
      />,
    );

    expect(html).toBe('<ul><li>No data</li></ul>');
  });
});

describe('BarList scale', () => {
  it('can be scaled to a chosen maximum and never overflows its track', () => {
    const html = renderToStaticMarkup(
      <BarList
        items={[
          { name: 'Big', total: 1000 },
          { name: 'Small', total: 50 },
        ]}
        label={(row) => row.name}
        value={(row) => row.total}
        keyExtractor={(row) => row.name}
        scaleTo={100}
      />,
    );

    expect(html).toContain('width:100%');
    expect(html).toContain('width:50%');
    expect(html).not.toContain('width:1000%');
  });
});
