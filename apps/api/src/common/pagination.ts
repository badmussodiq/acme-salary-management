import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX, type PageMeta, type Paginated } from '@acme/contracts';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGE_LIMIT_MAX)
  limit?: number;
}

export interface PageRequest {
  readonly page: number;
  readonly limit: number;
  readonly offset: number;
}

export const toPageRequest = (query: PaginationQueryDto): PageRequest => {
  const page = query.page ?? 1;
  const limit = query.limit ?? PAGE_LIMIT_DEFAULT;
  return { page, limit, offset: (page - 1) * limit };
};

export const toPaginated = <T>(
  items: readonly T[],
  total: number,
  request: PageRequest,
): Paginated<T> => {
  const meta: PageMeta = { page: request.page, limit: request.limit, total };
  return { items, meta };
};
