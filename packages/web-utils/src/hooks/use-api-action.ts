'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { httpRequest, HttpRequestError, type HttpMethod } from '../api/http-client';
import { useGenericState } from './use-generic-state';

export interface UseApiActionOptions<TResponse> {
  readonly method?: Exclude<HttpMethod, 'GET'>;
  readonly successMessage?: string | ((data: TResponse) => string);
  readonly errorMessage?: string;
  readonly onSuccess?: (data: TResponse) => void;
}

export type FieldErrors = Readonly<Record<string, string>>;

const NO_ERRORS: FieldErrors = {};

export const toFieldErrors = (error: HttpRequestError | undefined): FieldErrors =>
  error
    ? Object.fromEntries(error.details.map((detail) => [detail.field, detail.message]))
    : NO_ERRORS;

export const useApiAction = <TResponse, TBody = undefined>(
  url: string,
  options: UseApiActionOptions<TResponse> = {},
) => {
  const [pending, setPending] = useGenericState(false);
  const [error, setError] = useGenericState<HttpRequestError | undefined>(undefined);
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  const run = useCallback(
    async (body: TBody): Promise<TResponse | undefined> => {
      setPending(true);
      setError(undefined);
      try {
        const data = await httpRequest<TResponse, TBody>({
          url,
          method: latest.current.method ?? 'POST',
          body,
        });
        const { successMessage, onSuccess } = latest.current;
        if (successMessage) {
          toast.success(
            typeof successMessage === 'function' ? successMessage(data) : successMessage,
          );
        }
        onSuccess?.(data);
        return data;
      } catch (caught) {
        if (caught instanceof HttpRequestError) {
          setError(caught);
          toast.error(caught.message);
        } else {
          toast.error(latest.current.errorMessage ?? 'Something went wrong');
        }
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [url, setPending, setError],
  );

  return { run, pending, error, fieldErrors: toFieldErrors(error) };
};
