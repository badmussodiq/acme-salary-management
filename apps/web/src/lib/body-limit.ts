export const MAX_PROXY_BODY_BYTES = 100 * 1024;

export type BoundedBody =
  { readonly kind: 'ok'; readonly bytes: Uint8Array<ArrayBuffer> } | { readonly kind: 'too-large' };

const declaredLength = (request: Request): number | undefined => {
  const header = request.headers.get('content-length');
  const length = header === null ? Number.NaN : Number(header);
  return Number.isFinite(length) ? length : undefined;
};

export const readBodyWithLimit = async (
  request: Request,
  maximumBytes: number = MAX_PROXY_BODY_BYTES,
): Promise<BoundedBody> => {
  const declared = declaredLength(request);
  if (declared !== undefined && declared > maximumBytes) return { kind: 'too-large' };
  if (!request.body) return { kind: 'ok', bytes: new Uint8Array(0) };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maximumBytes) {
      await reader.cancel();
      return { kind: 'too-large' };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { kind: 'ok', bytes };
};
