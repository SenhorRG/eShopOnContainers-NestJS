import { describe, expect, it } from 'vitest';

import { buildJaegerSearchUrl } from './build-jaeger-url';

describe('buildJaegerSearchUrl', () => {
  it('builds a Jaeger search URL with service and lookback', () => {
    const url = buildJaegerSearchUrl('http://localhost:16686', 'catalog-service', 2);
    expect(url).toContain('service=catalog-service');
    expect(url).toContain('lookback=7200000');
  });
});
