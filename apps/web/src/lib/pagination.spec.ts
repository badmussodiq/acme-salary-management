import { describe, expect, it } from 'vitest';
import { pageFrom, pageWindow, paginate } from './pagination';

describe('pageWindow', () => {
  it('reports the visible range and page count', () => {
    expect(pageWindow({ page: 2, limit: 25, total: 60 })).toEqual({ from: 26, to: 50, pages: 3 });
    expect(pageWindow({ page: 3, limit: 25, total: 60 })).toEqual({ from: 51, to: 60, pages: 3 });
  });

  it('handles an empty list', () => {
    expect(pageWindow({ page: 1, limit: 25, total: 0 })).toEqual({ from: 0, to: 0, pages: 1 });
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 12 }, (_, index) => index + 1);

  it('returns the requested slice with its metadata', () => {
    expect(paginate(items, 2, 5)).toEqual({
      items: [6, 7, 8, 9, 10],
      meta: { page: 2, limit: 5, total: 12 },
    });
  });

  it('clamps a page outside the range', () => {
    expect(paginate(items, 99, 5).items).toEqual([11, 12]);
    expect(paginate(items, 0, 5).meta.page).toBe(1);
  });
});

describe('pageFrom', () => {
  it('accepts positive whole numbers and defaults to the first page', () => {
    expect(pageFrom('4')).toBe(4);
    expect(pageFrom(['2', '9'])).toBe(2);
    expect(pageFrom(undefined)).toBe(1);
    expect(pageFrom('0')).toBe(1);
    expect(pageFrom('1.5')).toBe(1);
    expect(pageFrom('abc')).toBe(1);
  });
});
