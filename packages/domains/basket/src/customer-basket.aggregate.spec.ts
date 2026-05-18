import { describe, expect, it } from 'vitest';

import { CustomerBasket } from './customer-basket.aggregate';
import { BasketDomainException } from './basket-domain.exception';

describe('CustomerBasket', () => {
  it('adds items and computes total', () => {
    const basket = CustomerBasket.create('buyer-1');
    basket.addItem({ productId: 1, quantity: 2, unitPrice: 10 });
    expect(basket.lineItems).toHaveLength(1);
    expect(basket.total()).toBe(20);
  });

  it('rejects duplicate product', () => {
    const basket = CustomerBasket.create('buyer-1');
    basket.addItem({ productId: 1, quantity: 1, unitPrice: 5 });
    expect(() => basket.addItem({ productId: 1, quantity: 1, unitPrice: 5 })).toThrow(BasketDomainException);
  });
});
