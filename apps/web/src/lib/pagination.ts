import { PAGE_LIMIT_DEFAULT } from '@acme/contracts';

export interface PageInfo {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export const pageWindow = (
  meta: PageInfo,
): { readonly from: number; readonly to: number; readonly pages: number } => {
  const limit = meta.limit || PAGE_LIMIT_DEFAULT;
  const pages = Math.max(1, Math.ceil(meta.total / limit));
  return {
    from: meta.total === 0 ? 0 : (meta.page - 1) * limit + 1,
    to: Math.min(meta.page * limit, meta.total),
    pages,
  };
};

export const paginate = <T>(
  items: readonly T[],
  page: number,
  limit: number,
): { readonly items: readonly T[]; readonly meta: PageInfo } => {
  const pages = Math.max(1, Math.ceil(items.length / limit));
  const current = Math.min(Math.max(page, 1), pages);
  return {
    items: items.slice((current - 1) * limit, current * limit),
    meta: { page: current, limit, total: items.length },
  };
};

export const pageFrom = (value: string | readonly string[] | undefined): number => {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, 100_000) : 1;
};
