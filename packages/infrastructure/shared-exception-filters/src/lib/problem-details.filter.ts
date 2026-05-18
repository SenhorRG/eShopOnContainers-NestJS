import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

/**
 * RFC 7807 `application/problem+json` filter with conventional `problem` fields (`title`, `status`, etc.).
 * - `stack` is only set when `NODE_ENV` is not `production`.
 * - `traceId` mirrors `X-Correlation-Id` / `X-Request-Id` or a new UUID.
 */
export type ProblemDetailsPayload = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId: string;
  stack?: string;
};

@Catch()
export class ProblemDetailsExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(ProblemDetailsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const traceId = pickTraceId(req);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | undefined;
    let type = 'about:blank';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const mapped = mapHttpException(exception);
      title = mapped.title;
      detail = mapped.detail;
      type = `https://httpstatuses.com/${String(status)}`;
    } else if (exception instanceof Error) {
      detail = exception.message;
      type = 'about:blank';
      this.log.error(exception.stack ?? exception.message);
    } else {
      detail = String(exception);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const body: ProblemDetailsPayload = {
      type,
      title,
      status,
      detail,
      instance: req.originalUrl ?? req.url,
      traceId,
    };

    if (!isProd && exception instanceof Error && exception.stack) {
      body.stack = exception.stack;
    }

    res.status(status);
    res.setHeader('Content-Type', 'application/problem+json; charset=utf-8');
    res.setHeader('x-correlation-id', traceId);
    res.json(body);
  }
}

function pickTraceId(req: Request): string {
  const a = req.headers['x-correlation-id'];
  const b = req.headers['x-request-id'];
  const c = typeof a === 'string' ? a.trim() : '';
  if (c.length) return c;
  const d = typeof b === 'string' ? b.trim() : '';
  if (d.length) return d;
  return randomUUID();
}

function mapHttpException(exception: HttpException): { title: string; detail: string } {
  const status = exception.getStatus();
  const r = exception.getResponse();
  if (typeof r === 'string') {
    return { title: shortTitle(status), detail: r };
  }

  const o = r as Record<string, unknown>;
  const err = o.error;
  const title = typeof err === 'string' ? err : shortTitle(status);

  const msg = o.message;
  const detail = Array.isArray(msg)
    ? msg.map((m) => String(m)).join('; ')
    : typeof msg === 'string'
      ? msg
      : exception.message;

  return { title, detail };
}

function shortTitle(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'Unprocessable Entity';
    default:
      return status >= 500 ? 'Server Error' : 'Error';
  }
}
