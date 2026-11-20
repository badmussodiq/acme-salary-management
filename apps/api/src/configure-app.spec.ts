import { describe, expect, it } from 'vitest';
import { rejectForbiddenKeys } from './configure-app';

const parse = (json: string): unknown => JSON.parse(json, rejectForbiddenKeys);

describe('rejectForbiddenKeys', () => {
  it('accepts ordinary documents', () => {
    expect(parse('{"name":"Ada","nested":{"items":[1,2]}}')).toEqual({
      name: 'Ada',
      nested: { items: [1, 2] },
    });
  });

  it.each(['{"__proto__":{"isAdmin":true}}', '{"a":{"constructor":{"x":1}}}', '[{"prototype":1}]'])(
    'rejects %s',
    (json) => {
      expect(() => parse(json)).toThrow('is not allowed');
    },
  );
});
