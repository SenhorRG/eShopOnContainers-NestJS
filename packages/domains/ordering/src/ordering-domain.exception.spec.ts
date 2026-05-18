import { describe, expect, test } from 'vitest';

import { OrderingDomainException } from './ordering-domain.exception';

describe('OrderingDomainException', () => {
  test('is an Error with domain name', () => {
    const e = new OrderingDomainException('bad');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('OrderingDomainException');
    expect(e.message).toBe('bad');
  });
});
