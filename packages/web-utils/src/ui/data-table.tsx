import type { ReactNode } from 'react';
import { Mapping } from './mapping';

export interface DataTableColumn<T> {
  readonly key: string;
  readonly header: ReactNode;
  readonly cell: (row: T, index: number) => ReactNode;
  readonly className?: string;
}

export interface DataTableProps<T> {
  readonly columns: readonly DataTableColumn<T>[];
  readonly data: readonly T[] | null;
  readonly keyExtractor: (row: T, index: number) => string | number;
  readonly empty?: ReactNode;
  readonly skeletonRows?: number;
  readonly className?: string;
}

export const DataTable = <T,>({
  columns,
  data,
  keyExtractor,
  empty,
  skeletonRows = 5,
  className,
}: DataTableProps<T>) => {
  if (empty !== undefined && data?.length === 0) return <>{empty}</>;

  return (
    <table className={className}>
      <thead>
        <tr>
          <Mapping array={columns} keyExtractor={(column) => column.key}>
            {(column) => <th className={column.className}>{column.header}</th>}
          </Mapping>
        </tr>
      </thead>
      <tbody>
        {data === null ? (
          <Mapping
            array={Array.from({ length: skeletonRows }, (_, index) => index)}
            keyExtractor={(row) => row}
          >
            {() => (
              <tr data-loading="true">
                <td colSpan={columns.length} />
              </tr>
            )}
          </Mapping>
        ) : (
          <Mapping array={data} keyExtractor={keyExtractor}>
            {(row, rowIndex) => (
              <tr>
                <Mapping array={columns} keyExtractor={(column) => column.key}>
                  {(column) => <td className={column.className}>{column.cell(row, rowIndex)}</td>}
                </Mapping>
              </tr>
            )}
          </Mapping>
        )}
      </tbody>
    </table>
  );
};
