import { afterEach, describe, expect, it } from 'vitest';

import { assignOtelServiceName } from './assign-service-name-env';

describe('assignOtelServiceName', () => {
  const previous = process.env.OTEL_SERVICE_NAME;

  afterEach(() => {
    if (previous === undefined) delete process.env.OTEL_SERVICE_NAME;
    else process.env.OTEL_SERVICE_NAME = previous;
  });

  it('sets OTEL_SERVICE_NAME when unset', () => {
    delete process.env.OTEL_SERVICE_NAME;
    expect(assignOtelServiceName('catalog-service')).toBe('catalog-service');
    expect(process.env.OTEL_SERVICE_NAME).toBe('catalog-service');
  });

  it('keeps existing OTEL_SERVICE_NAME', () => {
    process.env.OTEL_SERVICE_NAME = 'override-service';
    expect(assignOtelServiceName('catalog-service')).toBe('override-service');
  });

  it('replaces generic OTEL_SERVICE_NAME fallback from shared .env', () => {
    process.env.OTEL_SERVICE_NAME = 'eshop-nest-local';
    expect(assignOtelServiceName('catalog-service')).toBe('catalog-service');
    expect(process.env.OTEL_SERVICE_NAME).toBe('catalog-service');
  });
});
