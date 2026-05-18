import type { INestApplication } from '@nestjs/common';

import { correlationIdMiddleware } from './correlation-id';

/** Ensures every HTTP request has `x-correlation-id` on the request and response. */
export function applyCorrelationIdMiddleware(app: INestApplication): void {
  app.use(correlationIdMiddleware);
}
