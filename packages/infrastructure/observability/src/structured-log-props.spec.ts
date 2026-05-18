import { afterEach, describe, expect, it } from 'vitest';

import { createStructuredLogProps, resolveStructuredLogServiceName } from './structured-log-props';

describe('structured log props', () => {
  const previous = process.env.OTEL_SERVICE_NAME;

  afterEach(() => {
    if (previous === undefined) delete process.env.OTEL_SERVICE_NAME;
    else process.env.OTEL_SERVICE_NAME = previous;
  });

  it('defaults service name when env is unset', () => {
    delete process.env.OTEL_SERVICE_NAME;
    expect(resolveStructuredLogServiceName()).toBe('eshop-nest-unknown');
  });

  it('includes service_name in structured props', () => {
    process.env.OTEL_SERVICE_NAME = 'catalog-service';
    expect(createStructuredLogProps()).toEqual({ service_name: 'catalog-service' });
  });

  it('includes correlation_id when request header is present', () => {
    process.env.OTEL_SERVICE_NAME = 'mobile-bff';
    expect(
      createStructuredLogProps({ headers: { 'x-correlation-id': 'corr-1' } } as never),
    ).toEqual({ service_name: 'mobile-bff', correlation_id: 'corr-1' });
  });
});
