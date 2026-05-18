import { describe, expect, it } from 'vitest';

import { extractLogBody, extractLogContext, extractLogRoute, resolveLogService } from './extract-log-fields';

describe('extractLogFields', () => {
  it('resolves service from stream labels and otlp payload', () => {
    expect(
      resolveLogService(
        { service_name: 'catalog-service' },
        { resources: { 'service.name': 'ignored-when-label-exists' } },
      ),
    ).toBe('catalog-service');

    expect(resolveLogService({}, { resources: { 'service.name': 'identity-service' } })).toBe(
      'identity-service',
    );
  });

  it('extracts body, route, and context from otlp http logs', () => {
    const parsed = {
      body: 'request completed',
      severity: 'info',
      attributes: {
        req: { method: 'GET', url: '/api/health' },
        res: { statusCode: 200 },
        responseTime: 53,
        trace_id: 'abc123',
      },
    };

    expect(extractLogBody(parsed)).toBe('request completed');
    expect(extractLogRoute(parsed)).toBe('GET /api/health · → 200 · 53ms');
    expect(extractLogContext(parsed)).toContain('trace abc123');
  });
});
