import { describe, expect, it } from 'vitest';

import { orderStockHasRejection, validateOrderStockLines } from './validate-order-stock';

describe('validateOrderStockLines', () => {
  const snapshots = new Map([
    [1, { productId: 1, availableStock: 5 }],
    [2, { productId: 2, availableStock: 0 }],
  ]);

  it('marks lines with insufficient stock', () => {
    const result = validateOrderStockLines(
      [
        { productId: 1, units: 3 },
        { productId: 2, units: 1 },
      ],
      snapshots,
    );
    expect(result).toEqual([
      { productId: 1, hasStock: true },
      { productId: 2, hasStock: false },
    ]);
    expect(orderStockHasRejection(result)).toBe(true);
  });

  it('skips unknown products', () => {
    const result = validateOrderStockLines([{ productId: 99, units: 1 }], snapshots);
    expect(result).toEqual([]);
    expect(orderStockHasRejection(result)).toBe(false);
  });
});
