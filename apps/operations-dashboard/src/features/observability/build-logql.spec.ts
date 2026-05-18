import { describe, expect, it } from 'vitest';

import { buildServiceLogQueries } from './build-logql';

const catalog = [
  { id: 'catalog', otelServiceName: 'catalog-service' },
  { id: 'identity', otelServiceName: 'identity-service' },
];

describe('buildServiceLogQueries', () => {
  it('returns separate Loki selectors (no or between matchers)', () => {
    const queries = buildServiceLogQueries({
      serviceKey: 'catalog-service',
      catalog,
      level: 'all',
      search: '',
    });
    expect(queries).toHaveLength(2);
    expect(queries[0]).toBe('{service_name="catalog-service"}');
    expect(queries.join(' ')).not.toContain(' or ');
  });

  it('uses level stream labels instead of unsupported regex flags', () => {
    const queries = buildServiceLogQueries({
      serviceKey: 'identity-service',
      catalog,
      level: 'info',
      search: '',
    });
    expect(queries[0]).toContain('level=~"INFO|info"');
    expect(queries.join(' ')).not.toContain('(?i)');
  });

  it('builds union regex when all services are selected', () => {
    const queries = buildServiceLogQueries({
      serviceKey: '__all__',
      catalog,
      level: 'all',
      search: '',
    });
    expect(queries[0]).toContain('service_name=~"catalog-service|identity-service"');
  });
});
