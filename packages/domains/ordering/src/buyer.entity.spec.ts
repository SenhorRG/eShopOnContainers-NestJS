import { describe, expect, test } from 'vitest';

import { Buyer, paymentMethodMatches } from './buyer.entity';
import { OrderingDomainException } from './ordering-domain.exception';

describe('Buyer', () => {
  test('trims identity and name', () => {
    const b = new Buyer('  id-1  ', '  Alice  ');
    expect(b.identityGuid).toBe('id-1');
    expect(b.name).toBe('Alice');
  });

  test('rejects blank identity', () => {
    expect(() => new Buyer('', 'n')).toThrow(OrderingDomainException);
    expect(() => new Buyer('   ', 'n')).toThrow(OrderingDomainException);
  });

  test('rejects blank name', () => {
    expect(() => new Buyer('id', '')).toThrow(OrderingDomainException);
  });

  test('setPersisted assigns id', () => {
    const b = new Buyer('g', 'n');
    b.setPersisted(42);
    expect(b.id).toBe(42);
  });
});

describe('paymentMethodMatches', () => {
  test('returns true when card fields match', () => {
    const exp = new Date('2030-06-01');
    const row = { cardTypeId: 1, cardNumber: '4111', expiration: exp };
    expect(paymentMethodMatches(1, '4111', exp, row)).toBe(true);
  });

  test('returns false when any field differs', () => {
    const exp = new Date('2030-06-01');
    const row = { cardTypeId: 1, cardNumber: '4111', expiration: exp };
    expect(paymentMethodMatches(2, '4111', exp, row)).toBe(false);
    expect(paymentMethodMatches(1, '4222', exp, row)).toBe(false);
    expect(paymentMethodMatches(1, '4111', new Date('2031-01-01'), row)).toBe(false);
  });
});
