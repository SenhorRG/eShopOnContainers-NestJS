import { describe, expect, it } from 'vitest';

import {
  CORRELATION_ID_HEADER,
  correlationIdFromRequest,
  resolveCorrelationId,
} from './correlation-id';

describe('correlation id', () => {
  it('reads x-correlation-id from inbound request', () => {
    const req = { headers: { [CORRELATION_ID_HEADER]: 'abc-123' } };
    expect(correlationIdFromRequest(req as never)).toBe('abc-123');
    expect(resolveCorrelationId(req)).toBe('abc-123');
  });

  it('falls back to x-request-id', () => {
    const req = { headers: { 'x-request-id': 'req-9' } };
    expect(correlationIdFromRequest(req as never)).toBe('req-9');
  });

  it('generates a UUID when headers are absent', () => {
    const id = resolveCorrelationId({ headers: {} });
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
