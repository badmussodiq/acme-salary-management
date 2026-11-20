import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { HttpRequestError, httpRequestWithMeta, type HttpResult } from '@acme/web-utils';
import { apiUrl } from './api-config';

const SERVER_FETCH_TIMEOUT_MS = 15_000;

const forwardedHeaders = async (): Promise<Record<string, string>> => {
  const incoming = await headers();
  const forwardedFor = incoming.get('x-forwarded-for');
  return {
    cookie: (await cookies()).toString(),
    ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
  };
};

export const serverGet = async <T>(path: string): Promise<HttpResult<T>> => {
  try {
    return await httpRequestWithMeta<T>({
      url: apiUrl(path),
      headers: await forwardedHeaders(),
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof HttpRequestError) {
      if (error.status === 401) redirect('/session-expired');
      if (error.status === 404) notFound();
    }
    throw error;
  }
};

export const serverData = async <T>(path: string): Promise<T> => (await serverGet<T>(path)).data;
