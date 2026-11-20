import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useApiAction } from './use-api-action';

vi.mock('sonner', () => ({
  toast: { success: vi.fn<(message: string) => void>(), error: vi.fn<(message: string) => void>() },
}));

const respond = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useApiAction', () => {
  it('returns data, toasts success and calls onSuccess', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve(respond(200, { success: true, data: { id: 7 } }))),
    );
    const onSuccess = vi.fn<(data: { id: number }) => void>();
    const { result } = renderHook(() =>
      useApiAction<{ id: number }, { name: string }>('/x', { successMessage: 'Saved', onSuccess }),
    );

    let data: { id: number } | undefined;
    await act(async () => {
      data = await result.current.run({ name: 'a' });
    });

    expect(data).toEqual({ id: 7 });
    expect(toast.success).toHaveBeenCalledWith('Saved');
    expect(onSuccess).toHaveBeenCalledWith({ id: 7 });
    expect(result.current.pending).toBe(false);
  });

  it('exposes field errors from a validation failure and toasts the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          respond(400, {
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Request validation failed',
              details: [{ field: 'email', message: 'email must be an email' }],
              requestId: 'r',
              timestamp: 't',
            },
          }),
        ),
      ),
    );
    const { result } = renderHook(() => useApiAction<unknown, { email: string }>('/x'));

    await act(async () => {
      await result.current.run({ email: 'bad' });
    });

    expect(result.current.fieldErrors).toEqual({ email: 'email must be an email' });
    expect(toast.error).toHaveBeenCalledWith('Request validation failed');
  });

  it('clears previous errors on the next successful run', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        respond(409, {
          success: false,
          error: { code: 'CONFLICT', message: 'dup', requestId: 'r', timestamp: 't' },
        }),
      )
      .mockResolvedValueOnce(respond(200, { success: true, data: null }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useApiAction<null>('/x'));

    await act(async () => {
      await result.current.run(undefined);
    });
    expect(result.current.error?.code).toBe('CONFLICT');

    await act(async () => {
      await result.current.run(undefined);
    });
    expect(result.current.error).toBeUndefined();
  });
});
