import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFieldState } from './use-field-state';
import { useFormFields } from './use-form-fields';
import { useGenericState } from './use-generic-state';

describe('useGenericState', () => {
  it('replaces the value and supports updater functions', () => {
    const { result } = renderHook(() => useGenericState(1));

    act(() => result.current[1](5));
    act(() => result.current[1]((previous) => previous + 1));

    expect(result.current[0]).toBe(6);
  });

  it('keeps a referentially stable setter', () => {
    const { result, rerender } = renderHook(() => useGenericState(false));
    const first = result.current[1];

    rerender();

    expect(result.current[1]).toBe(first);
  });
});

describe('useFieldState', () => {
  it('patches one field without touching the others', () => {
    const { result } = renderHook(() => useFieldState({ name: 'a', age: 1 }));

    act(() => result.current[1]('age', (previous) => previous + 1));

    expect(result.current[0]).toEqual({ name: 'a', age: 2 });
  });
});

describe('useFormFields', () => {
  it('binds fields, patches several at once and resets', () => {
    const { result } = renderHook(() => useFormFields({ name: '', country: 'NG' }));

    act(() => result.current.bind('name').onChange('Ada'));
    expect(result.current.bind('name').value).toBe('Ada');

    act(() => result.current.patch({ name: 'Bola', country: 'GH' }));
    expect(result.current.values).toEqual({ name: 'Bola', country: 'GH' });

    act(() => result.current.reset());
    expect(result.current.values).toEqual({ name: '', country: 'NG' });
  });
});
