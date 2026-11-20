import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataTable, type DataTableColumn } from './data-table';
import { Mapping } from './mapping';

interface Row {
  readonly id: number;
  readonly name: string;
}

const columns: readonly DataTableColumn<Row>[] = [
  { key: 'id', header: 'ID', cell: (row) => row.id },
  { key: 'name', header: 'Name', cell: (row) => row.name },
];

describe('Mapping', () => {
  it('renders each item', () => {
    const html = renderToStaticMarkup(
      <Mapping array={['a', 'b']}>{(item) => <span>{item}</span>}</Mapping>,
    );

    expect(html).toBe('<span>a</span><span>b</span>');
  });

  it('renders the empty state for an empty array', () => {
    const html = renderToStaticMarkup(
      <Mapping array={[]} empty={<p>nothing</p>}>
        {() => <span>x</span>}
      </Mapping>,
    );

    expect(html).toBe('<p>nothing</p>');
  });
});

describe('DataTable', () => {
  it('renders headers and rows', () => {
    const html = renderToStaticMarkup(
      <DataTable
        columns={columns}
        data={[{ id: 1, name: 'Ada' }]}
        keyExtractor={(row) => row.id}
      />,
    );

    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<td>Ada</td>');
  });

  it('renders placeholder rows while loading', () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={null} skeletonRows={3} keyExtractor={(row) => row.id} />,
    );

    expect(html.match(/data-loading/g)).toHaveLength(3);
  });

  it('renders the empty state', () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={[]} empty="No employees" keyExtractor={(row) => row.id} />,
    );

    expect(html).toBe('No employees');
  });
});
