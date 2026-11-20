import { createHash } from 'node:crypto';

export interface Random {
  next(): number;
  int(minimum: number, maximum: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(entries: readonly (readonly [T, number])[]): T;
  chance(probability: number): boolean;
}

export const createRandom = (seed: number): Random => {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (minimum: number, maximum: number): number =>
    minimum + Math.floor(next() * (maximum - minimum + 1));

  const pick = <T>(items: readonly T[]): T => {
    const item = items[int(0, items.length - 1)];
    if (item === undefined) throw new Error('Cannot pick from an empty list');
    return item;
  };

  const weighted = <T>(entries: readonly (readonly [T, number])[]): T => {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let threshold = next() * total;
    for (const [value, weight] of entries) {
      threshold -= weight;
      if (threshold < 0) return value;
    }
    const last = entries.at(-1);
    if (!last) throw new Error('Cannot pick from an empty list');
    return last[0];
  };

  return { next, int, pick, weighted, chance: (probability) => next() < probability };
};

export const deterministicUuid = (namespace: string, index: number): string => {
  const bytes = createHash('sha1').update(`${namespace}:${index}`).digest().subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
