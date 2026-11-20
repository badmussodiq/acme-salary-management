import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export const requestIdMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const id = randomUUID();
  request.headers[REQUEST_ID_HEADER] = id;
  response.setHeader(REQUEST_ID_HEADER, id);
  next();
};

export const readRequestId = (request: Request): string => {
  const header = request.headers[REQUEST_ID_HEADER];
  return typeof header === 'string' ? header : 'unknown';
};
