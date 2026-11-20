import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { HttpRequestError, httpRequestWithMeta, type HttpResult } from '@acme/web-utils';
import { apiUrl } from './api-config';

export const serverGet = async <T>(path: string): Promise<HttpResult<T>> => {
  const cookieHeader = (await cookies()).toString();
  try {
    return await httpRequestWithMeta<T>({ url: apiUrl(path), headers: { cookie: cookieHeader } });
  } catch (error) {
    if (error instanceof HttpRequestError) {
      if (error.status === 401) redirect('/login');
      if (error.status === 404) notFound();
    }
    throw error;
  }
};

export const serverData = async <T>(path: string): Promise<T> => (await serverGet<T>(path)).data;
