import { describe, expect, it } from 'vitest';

import { summarizeJaegerTrace, type JaegerTrace } from './query-jaeger';

describe('summarizeJaegerTrace', () => {
  it('summarizes root span and duration', () => {
    const trace: JaegerTrace = {
      traceID: 'abc123',
      processes: { p1: { serviceName: 'catalog-service' } },
      spans: [
        {
          traceID: 'abc123',
          spanID: 's1',
          operationName: 'GET /api/items',
          startTime: 1_000_000,
          duration: 2_000_000,
          processID: 'p1',
        },
        {
          traceID: 'abc123',
          spanID: 's2',
          operationName: 'db.query',
          startTime: 1_500_000,
          duration: 500_000,
          processID: 'p1',
          references: [{ refType: 'CHILD_OF', traceID: 'abc123', spanID: 's1' }],
        },
      ],
    };

    const summary = summarizeJaegerTrace(trace);
    expect(summary?.traceId).toBe('abc123');
    expect(summary?.operation).toBe('GET /api/items');
    expect(summary?.spanCount).toBe(2);
    expect(summary?.durationMs).toBeGreaterThan(0);
  });
});
