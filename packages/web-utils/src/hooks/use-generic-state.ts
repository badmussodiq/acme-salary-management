'use client';

import { useCallback, useState } from 'react';

export type Updater<T> = T | ((previous: T) => T);
export type ReplaceState<T> = (value: Updater<T>) => void;

const isUpdateFunction = <T>(value: Updater<T>): value is (previous: T) => T =>
  typeof value === 'function';

export const resolveUpdater = <T>(value: Updater<T>, previous: T): T =>
  isUpdateFunction(value) ? value(previous) : value;

export const useGenericState = <T>(initial: T | (() => T)): readonly [T, ReplaceState<T>] => {
  const [state, setState] = useState<T>(initial);
  const replace = useCallback<ReplaceState<T>>((value) => {
    setState((previous) => resolveUpdater(value, previous));
  }, []);
  return [state, replace];
};
