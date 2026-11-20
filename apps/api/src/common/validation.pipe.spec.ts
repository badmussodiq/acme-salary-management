import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AppException } from './app.exception';
import { createValidationPipe } from './validation.pipe';

class SampleDto {
  @IsString() @MaxLength(5) name!: string;
  @IsInt() @Min(1) @Max(10) limit!: number;
}

const transform = (value: unknown): Promise<unknown> =>
  createValidationPipe().transform(value, { type: 'body', metatype: SampleDto });

describe('createValidationPipe', () => {
  it('accepts a valid payload', async () => {
    await expect(transform({ name: 'abc', limit: 3 })).resolves.toMatchObject({ name: 'abc' });
  });

  it('rejects unknown properties', async () => {
    await expect(transform({ name: 'abc', limit: 3, admin: true })).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('reports every invalid field with a machine-readable code', async () => {
    const error = await transform({ name: 'toolong', limit: 99 }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppException);
    if (!(error instanceof AppException)) return;
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.details?.map((detail) => detail.field)).toEqual(['name', 'limit']);
  });
});
