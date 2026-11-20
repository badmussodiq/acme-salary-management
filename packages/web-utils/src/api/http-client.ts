import {
  isApiErrorResponse,
  type ApiResponse,
  type ErrorCode,
  type FieldError,
  type PageMeta,
} from '@acme/contracts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestConfig<TBody> {
  readonly url: string;
  readonly method?: HttpMethod;
  readonly body?: TBody;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}

export interface HttpResult<TResponse> {
  readonly data: TResponse;
  readonly meta: PageMeta | undefined;
}

export interface HttpRequestErrorInit {
  readonly status: number;
  readonly code: ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN';
  readonly details?: readonly FieldError[];
  readonly requestId?: string;
}

export class HttpRequestError extends Error {
  readonly status: number;
  readonly code: HttpRequestErrorInit['code'];
  readonly details: readonly FieldError[];
  readonly requestId: string | undefined;

  constructor(message: string, init: HttpRequestErrorInit) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? [];
    this.requestId = init.requestId;
  }
}

const parseJson = <T>(text: string): T | undefined => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const httpRequestWithMeta = async <TResponse, TBody = undefined>(
  config: HttpRequestConfig<TBody>,
): Promise<HttpResult<TResponse>> => {
  const hasBody = config.body !== undefined;
  const response = await fetch(config.url, {
    method: config.method ?? 'GET',
    headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...config.headers },
    body: hasBody ? JSON.stringify(config.body) : null,
    signal: config.signal ?? null,
    credentials: 'include',
    cache: 'no-store',
  }).catch(() => {
    throw new HttpRequestError('Network request failed', { status: 0, code: 'NETWORK_ERROR' });
  });

  const payload = parseJson<ApiResponse<TResponse>>(await response.text());

  if (isApiErrorResponse(payload)) {
    throw new HttpRequestError(payload.error.message, {
      status: response.status,
      code: payload.error.code,
      ...(payload.error.details ? { details: payload.error.details } : {}),
      requestId: payload.error.requestId,
    });
  }

  if (!response.ok || payload?.success !== true) {
    throw new HttpRequestError(response.statusText || 'Request failed', {
      status: response.status,
      code: 'UNKNOWN',
    });
  }

  return { data: payload.data, meta: payload.meta };
};

export const httpRequest = async <TResponse, TBody = undefined>(
  config: HttpRequestConfig<TBody>,
): Promise<TResponse> => (await httpRequestWithMeta<TResponse, TBody>(config)).data;
