import { Fragment, type ReactNode } from 'react';

export interface MappingProps<T> {
  readonly array: readonly T[] | null | undefined;
  readonly children: (item: T, index: number) => ReactNode;
  readonly keyExtractor?: (item: T, index: number) => string | number;
  readonly empty?: ReactNode;
}

export const Mapping = <T,>({ array, children, keyExtractor, empty }: MappingProps<T>) => {
  if (empty !== undefined && array?.length === 0) return <>{empty}</>;

  return (
    <>
      {array?.map((item, index) => (
        <Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
          {children(item, index)}
        </Fragment>
      ))}
    </>
  );
};
