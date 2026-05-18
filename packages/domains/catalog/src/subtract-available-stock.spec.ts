import { describe, expect, it } from 'vitest';

import { CatalogDomainException } from './catalog-domain.exception';
import { subtractAvailableStock } from './subtract-available-stock';

describe('subtractAvailableStock', () => {
  it('returns min of desired and available', () => {
    expect(subtractAvailableStock(10, 3, 'Widget')).toBe(3);
    expect(subtractAvailableStock(2, 5, 'Widget')).toBe(2);
  });

  it('throws when stock is empty', () => {
    expect(() => subtractAvailableStock(0, 1, 'Widget')).toThrow(CatalogDomainException);
  });

  it('throws when quantity is not positive', () => {
    expect(() => subtractAvailableStock(5, 0, 'Widget')).toThrow(CatalogDomainException);
  });
});
