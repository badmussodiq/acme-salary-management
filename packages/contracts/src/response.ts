export interface PageMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PageMeta;
}

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly meta: PageMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | import('./errors').ApiErrorResponse;
