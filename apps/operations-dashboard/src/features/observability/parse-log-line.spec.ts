import { describe, expect, it } from 'vitest';

import { parseLogLine } from './parse-log-line';

describe('parseLogLine', () => {
  it('parses structured pino json', () => {
    const parsed = parseLogLine(
      JSON.stringify({ level: 50, msg: 'order failed', service_name: 'ordering-service' }),
      '1700000000000000000',
      { service_name: 'ordering-service' },
    );
    expect(parsed.level).toBe('error');
    expect(parsed.service).toBe('ordering-service');
    expect(parsed.body).toBe('order failed');
  });

  it('parses otlp json logs with dedicated columns', () => {
    const parsed = parseLogLine(
      JSON.stringify({
        body: 'request completed',
        severity: 'info',
        attributes: {
          req: { method: 'GET', url: '/api/health' },
          res: { statusCode: 200 },
          responseTime: 53,
          trace_id: 'abc123',
        },
      }),
      '1700000000000000000',
      { service_name: 'identity-service', level: 'INFO' },
    );
    expect(parsed.level).toBe('info');
    expect(parsed.service).toBe('identity-service');
    expect(parsed.body).toBe('request completed');
    expect(parsed.route).toBe('GET /api/health · → 200 · 53ms');
    expect(parsed.context).toContain('trace abc123');
  });

  it('falls back to plain text', () => {
    const parsed = parseLogLine('ERROR something broke', '1700000000000000000');
    expect(parsed.level).toBe('error');
    expect(parsed.body).toContain('something broke');
  });
});
