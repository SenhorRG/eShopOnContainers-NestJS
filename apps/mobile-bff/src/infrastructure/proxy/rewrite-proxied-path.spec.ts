import { describe, expect, it } from 'vitest';

import { rewriteProxiedPath } from './rewrite-proxied-path';

describe('rewriteProxiedPath', () => {
  it('restores mount prefix when Express strips it to /', () => {
    expect(rewriteProxiedPath('/', '/api/basket')).toBe('/api/basket');
    expect(rewriteProxiedPath('', '/api/basket')).toBe('/api/basket');
  });

  it('appends subpaths after the upstream prefix', () => {
    expect(rewriteProxiedPath('/cardtypes', '/api/orders')).toBe('/api/orders/cardtypes');
  });

  it('maps catalog-api mount to catalog service /api/catalog', () => {
    expect(rewriteProxiedPath('/items', '/api/catalog')).toBe('/api/catalog/items');
  });

  it('maps identity mount to identity /api/* routes', () => {
    expect(rewriteProxiedPath('/auth/login', '/api')).toBe('/api/auth/login');
  });
});
