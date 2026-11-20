export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

export const containsPattern = (value: string): string => `%${escapeLike(value)}%`;

export const prefixPattern = (value: string): string => `${escapeLike(value)}%`;
