const DEFAULT_API_ORIGIN = 'http://localhost:3001';

export const apiOrigin = (): string => process.env['API_ORIGIN'] ?? DEFAULT_API_ORIGIN;

export const apiUrl = (path: string): string => `${apiOrigin()}/api/v1${path}`;
