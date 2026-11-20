export type HealthStatus = 'ok' | 'unavailable';

export interface LiveResponse {
  readonly status: 'ok';
}

export interface ReadyResponse {
  readonly status: HealthStatus;
  readonly checks: { readonly database: HealthStatus };
}
