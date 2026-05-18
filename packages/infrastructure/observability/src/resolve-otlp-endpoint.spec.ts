import { afterEach, describe, expect, it } from 'vitest';

import { normalizeOtlpSignalUrl, resolveOtlpEndpoint } from './resolve-otlp-endpoint';

describe('resolveOtlpEndpoint', () => {
  const previous = {
    base: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    traces: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    metrics: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
    logs: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(previous)) {
      const envKey =
        key === 'base'
          ? 'OTEL_EXPORTER_OTLP_ENDPOINT'
          : key === 'traces'
            ? 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'
            : key === 'metrics'
              ? 'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT'
              : 'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT';
      if (value === undefined) delete process.env[envKey];
      else process.env[envKey] = value;
    }
  });

  it('prefers explicit endpoint over env', () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318';
    expect(resolveOtlpEndpoint('traces', 'http://explicit:4318')).toBe('http://explicit:4318');
  });

  it('falls back to OTEL_EXPORTER_OTLP_ENDPOINT', () => {
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318';
    expect(resolveOtlpEndpoint('traces')).toBe('http://collector:4318');
  });
});

describe('normalizeOtlpSignalUrl', () => {
  it('appends /v1/traces when missing', () => {
    expect(normalizeOtlpSignalUrl('http://localhost:14318', 'traces')).toBe(
      'http://localhost:14318/v1/traces',
    );
  });

  it('keeps existing /v1/metrics suffix', () => {
    expect(normalizeOtlpSignalUrl('http://localhost:14318/v1/metrics', 'metrics')).toBe(
      'http://localhost:14318/v1/metrics',
    );
  });
});
