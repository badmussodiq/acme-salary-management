import type { AvatarMimeType } from '@acme/contracts';

const startsWith = (body: Buffer, bytes: readonly number[], offset = 0): boolean =>
  bytes.every((byte, index) => body[offset + index] === byte);

export const sniffImageType = (body: Buffer): AvatarMimeType | undefined => {
  if (startsWith(body, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(body, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(body, [0x52, 0x49, 0x46, 0x46]) && startsWith(body, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }
  return undefined;
};
