import { describe, expect, it } from 'vitest';

import { assertValidCatalogItem, shouldReorder } from './catalog-item.rules';
import { CatalogDomainException } from './catalog-domain.exception';

describe('catalog item rules', () => {
  it('accepts valid item', () => {
    expect(() =>
      assertValidCatalogItem({
        name: 'Cup',
        price: 9.99,
        availableStock: 50,
        restockThreshold: 10,
        maxStockThreshold: 200,
        onReorder: false,
      }),
    ).not.toThrow();
  });

  it('rejects invalid thresholds', () => {
    expect(() =>
      assertValidCatalogItem({
        name: 'Cup',
        price: 1,
        availableStock: 5,
        restockThreshold: 100,
        maxStockThreshold: 10,
        onReorder: false,
      }),
    ).toThrow(CatalogDomainException);
  });

  it('detects reorder condition', () => {
    expect(
      shouldReorder({
        availableStock: 5,
        restockThreshold: 10,
        maxStockThreshold: 100,
        onReorder: false,
      }),
    ).toBe(true);
  });
});
