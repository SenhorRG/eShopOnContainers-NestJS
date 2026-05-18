import { describe, expect, test } from 'vitest';

import { OrderItem } from './order-item';
import { OrderingDomainException } from './ordering-domain.exception';

describe('OrderItem', () => {
  test('rejects non-positive units', () => {
    expect(() => new OrderItem(1, 'p', 10, 0, '', 0)).toThrow(OrderingDomainException);
  });

  test('rejects discount exceeding line total', () => {
    expect(() => new OrderItem(1, 'p', 10, 100, '', 1)).toThrow(OrderingDomainException);
  });

  test('setNewDiscount rejects negative', () => {
    const item = new OrderItem(1, 'p', 10, 0, '', 1);
    expect(() => item.setNewDiscount(-1)).toThrow(OrderingDomainException);
  });

  test('addUnits rejects negative delta', () => {
    const item = new OrderItem(1, 'p', 10, 0, '', 1);
    expect(() => item.addUnits(-1)).toThrow(OrderingDomainException);
  });

  test('addUnits increases units', () => {
    const item = new OrderItem(1, 'p', 10, 0, '', 1);
    item.addUnits(2);
    expect(item.units).toBe(3);
  });
});
