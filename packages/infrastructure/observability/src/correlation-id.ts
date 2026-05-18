import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function correlationIdFromRequest(req?: IncomingMessage): string | undefined {
  if (!req?.headers) return undefined;

  const raw = req.headers[CORRELATION_ID_HEADER] ?? req.headers['x-request-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

/** Resolves an inbound correlation id or generates a new UUID. */
export function resolveCorrelationId(req: Pick<Request, 'headers'>): string {
  const fromHeaders = correlationIdFromRequest(req as IncomingMessage);
  return fromHeaders ?? randomUUID();
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = resolveCorrelationId(req);
  req.headers[CORRELATION_ID_HEADER] = id;
  res.setHeader(CORRELATION_ID_HEADER, id);
  next();
}

export function setCorrelationIdResponseHeader(res: ServerResponse, correlationId: string): void {
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
}
