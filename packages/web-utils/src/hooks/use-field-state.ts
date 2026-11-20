'use client';

import { useCallback, useState } from 'react';
import { resolveUpdater, type ReplaceState, type Updater } from './use-generic-state';

export type SetField<T extends object> = <K extends keyof T>(key: K, value: Updater<T[K]>) => void;

export const useFieldState = <T extends object>(
  initial: T | (() => T),
): readonly [T, SetField<T>, ReplaceState<T>] => {
  const [state, setState] = useState<T>(initial);

  const setField = useCallback<SetField<T>>((key, value) => {
    setState((previous) => ({ ...previous, [key]: resolveUpdater(value, previous[key]) }));
  }, []);

  const replace = useCallback<ReplaceState<T>>((value) => {
    setState((previous) => resolveUpdater(value, previous));
  }, []);

  return [state, setField, replace];
};
