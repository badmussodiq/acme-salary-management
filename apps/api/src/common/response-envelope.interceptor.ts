import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { ApiSuccessResponse, Paginated } from '@acme/contracts';

export const isPaginated = (value: unknown): value is Paginated<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  'items' in value &&
  Array.isArray(value.items) &&
  'meta' in value &&
  typeof value.meta === 'object' &&
  value.meta !== null;

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor<
  unknown,
  ApiSuccessResponse<unknown>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<unknown>> {
    return next
      .handle()
      .pipe(
        map((value: unknown): ApiSuccessResponse<unknown> =>
          isPaginated(value)
            ? { success: true, data: value.items, meta: value.meta }
            : { success: true, data: value },
        ),
      );
  }
}
