'use client';

import { useCallback } from 'react';
import { useFieldState } from './use-field-state';

export interface FieldBinding<V> {
  readonly value: V;
  readonly onChange: (value: V) => void;
}

export const useFormFields = <T extends object>(initial: T) => {
  const [values, setField, replace] = useFieldState<T>(initial);

  const bind = useCallback(
    <K extends keyof T>(key: K): FieldBinding<T[K]> => ({
      value: values[key],
      onChange: (value) => {
        setField(key, value);
      },
    }),
    [values, setField],
  );

  const patch = useCallback(
    (partial: Partial<T>) => {
      replace((previous) => ({ ...previous, ...partial }));
    },
    [replace],
  );

  const reset = useCallback(() => {
    replace(initial);
  }, [replace, initial]);

  return { values, setField, bind, patch, reset };
};
