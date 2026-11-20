const DEFAULT_API_URL = 'http://localhost:3001/api/v1';

export const apiUrl = (path: string): string =>
  `${process.env['API_URL'] ?? DEFAULT_API_URL}${path}`;
