import { describe, expect, it } from 'vitest';
import { readBodyWithLimit } from './body-limit';

const post = (body: BodyInit | null, headers: HeadersInit = {}): Request =>
  new Request('http://localhost/x', { method: 'POST', body, headers });

const streamOf = (...parts: string[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
      controller.close();
    },
  });

describe('readBodyWithLimit', () => {
  it('returns the bytes of a small body', async () => {
    const result = await readBodyWithLimit(post('{"a":1}'), 100);

    expect(result.kind).toBe('ok');
    expect(result.kind === 'ok' && new TextDecoder().decode(result.bytes)).toBe('{"a":1}');
  });

  it('treats a missing body as empty', async () => {
    const result = await readBodyWithLimit(new Request('http://localhost/x'), 100);

    expect(result).toEqual({ kind: 'ok', bytes: new Uint8Array(0) });
  });

  it('rejects early when the declared length is too large', async () => {
    const result = await readBodyWithLimit(post('x', { 'content-length': '5000' }), 100);

    expect(result).toEqual({ kind: 'too-large' });
  });

  it('rejects a streamed body that grows past the limit without declaring a length', async () => {
    const request = new Request('http://localhost/x', {
      method: 'POST',
      body: streamOf('a'.repeat(60), 'b'.repeat(60)),
      duplex: 'half',
    } as RequestInit);

    expect(await readBodyWithLimit(request, 100)).toEqual({ kind: 'too-large' });
  });

  it('accepts a body exactly at the limit', async () => {
    const result = await readBodyWithLimit(post('a'.repeat(100)), 100);

    expect(result.kind).toBe('ok');
  });
});
