import { describe, expect, test } from 'vitest';

import { Address } from './address.vo';
import { Order, type PersistedOrderingOrderRow } from './order.aggregate';
import { OrderingDomainException } from './ordering-domain.exception';
import { OrderStatus } from './order-status';

describe('Order aggregate transitions', () => {
  test('grace period → awaiting validation emits domain event snapshot', () => {
    const o = Order.newDraft();
    o.setPersistedId(9001);
    o.addOrderItem(1, 'x', 10, 0, '', 1);
    expect(o.peekDomainEvents()).toHaveLength(0);
    o.setAwaitingValidationStatus();
    expect(o.orderStatus).toBe(OrderStatus.AwaitingValidation);

    const ev = o.peekDomainEvents().pop();
    expect(ev?.type).toBe('OrderStatusChangedToAwaitingValidationDomainEvent');
  });

  test('Submitted → Paid path requires StockConfirmed intermediary', () => {
    const o = Order.createSubmitted({
      persistedId: 5,
      userId: 'u',
      userName: 'n',
      address: new Address('s', 'c', 'st', 'ct', 'z'),
      cardTypeId: 1,
      cardNumber: '1',
      cardSecurityNumber: '1',
      cardHolderName: 'h',
      cardExpiration: new Date('2030-01-01'),
    });
    o.pullDomainEvents();

    expect(() => o.setPaidStatus()).not.toThrow();
    expect(o.orderStatus).toBe(OrderStatus.Submitted);

    o.setPersistedId(5); // ensured
    o.setAwaitingValidationStatus();
    o.setStockConfirmedStatus();
    o.setPaidStatus();
    expect(o.orderStatus).toBe(OrderStatus.Paid);

    expect(() => o.setShippedStatus()).not.toThrow();
    expect(o.orderStatus).toBe(OrderStatus.Shipped);
  });

  test('stock rejection from AwaitingValidation cancels order and summarizes product names', () => {
    const o = Order.newDraft();
    o.setPersistedId(901);
    o.addOrderItem(10, 'Widget', 5, 0, '', 2);
    o.setAwaitingValidationStatus();
    o.pullDomainEvents();

    o.setCancelledStatusWhenStockIsRejected([10]);
    expect(o.orderStatus).toBe(OrderStatus.Cancelled);
    expect(o.description).toContain('Widget');
  });

  test('hydrate rebuilds aggregate from persisted row', () => {
    const row: PersistedOrderingOrderRow = {
      Id: 42,
      BuyerId: 1,
      PaymentMethodId: 2,
      OrderDate: new Date('2024-06-01'),
      OrderStatus: OrderStatus.Paid,
      Description: 'ok',
      Street: '1 Main',
      City: 'Town',
      State: 'ST',
      Country: 'US',
      ZipCode: '12345',
      orderItems: [
        {
          Id: 10,
          ProductId: 7,
          ProductName: 'P',
          PictureUrl: null,
          UnitPrice: 3,
          Discount: 0,
          Units: 2,
        },
      ],
    };
    const o = Order.hydrate(row);
    expect(o.id).toBe(42);
    expect(o.orderStatus).toBe(OrderStatus.Paid);
    expect(o.description).toBe('ok');
    expect(o.orderItems).toHaveLength(1);
    expect(o.orderItems[0]?.productId).toBe(7);
    expect(o.orderItems[0]?.units).toBe(2);
    expect(o.address.street).toBe('1 Main');
  });

  test('attachPersistedIdentity updates OrderStarted placeholder id', () => {
    const o = Order.createSubmitted({
      userId: 'u',
      userName: 'n',
      address: new Address('s', 'c', 'st', 'ct', 'z'),
      cardTypeId: 1,
      cardNumber: '1',
      cardSecurityNumber: '1',
      cardHolderName: 'h',
      cardExpiration: new Date('2030-01-01'),
    });
    const started = o.peekDomainEvents().find((e) => e.type === 'OrderStartedDomainEvent');
    expect(started && 'orderId' in started && (started as { orderId: number }).orderId).toBe(-1);
    o.attachPersistedIdentity(999);
    const after = o.peekDomainEvents().find((e) => e.type === 'OrderStartedDomainEvent');
    expect(after && 'orderId' in after && (after as { orderId: number }).orderId).toBe(999);
    expect(o.id).toBe(999);
  });

  test('addOrderItem merges same product and applies higher discount', () => {
    const o = Order.newDraft();
    o.setPersistedId(1);
    o.addOrderItem(1, 'A', 10, 0, '', 1);
    o.addOrderItem(1, 'A', 10, 5, '', 2);
    expect(o.orderItems).toHaveLength(1);
    expect(o.orderItems[0]?.units).toBe(3);
    expect(o.orderItems[0]?.discount).toBe(5);
  });

  test('getTotal sums line totals', () => {
    const o = Order.newDraft();
    o.setPersistedId(1);
    o.addOrderItem(1, 'A', 10, 0, '', 2);
    o.addOrderItem(2, 'B', 3, 0, '', 4);
    expect(o.getTotal()).toBe(2 * 10 + 4 * 3);
  });

  test('setPaymentMethodVerified stores buyer and payment', () => {
    const o = Order.newDraft();
    o.setPersistedId(1);
    o.setPaymentMethodVerified(77, 88);
    expect(o.buyerId).toBe(77);
    expect(o.paymentId).toBe(88);
  });

  test('setCancelledStatus from Submitted emits cancellation', () => {
    const o = Order.createSubmitted({
      persistedId: 3,
      userId: 'u',
      userName: 'n',
      address: new Address('s', 'c', 'st', 'ct', 'z'),
      cardTypeId: 1,
      cardNumber: '1',
      cardSecurityNumber: '1',
      cardHolderName: 'h',
      cardExpiration: new Date('2030-01-01'),
    });
    o.pullDomainEvents();
    o.setCancelledStatus();
    expect(o.orderStatus).toBe(OrderStatus.Cancelled);
    const last = o.peekDomainEvents().pop();
    expect(last?.type).toBe('OrderCancelledDomainEvent');
  });

  test('setCancelledStatus from Paid throws', () => {
    const o = Order.newDraft();
    o.setPersistedId(1);
    o.addOrderItem(1, 'x', 1, 0, '', 1);
    o.setAwaitingValidationStatus();
    o.pullDomainEvents();
    o.setStockConfirmedStatus();
    o.setPaidStatus();
    expect(() => o.setCancelledStatus()).toThrow(OrderingDomainException);
  });

  test('setShippedStatus from Submitted throws', () => {
    const o = Order.createSubmitted({
      persistedId: 1,
      userId: 'u',
      userName: 'n',
      address: new Address('s', 'c', 'st', 'ct', 'z'),
      cardTypeId: 1,
      cardNumber: '1',
      cardSecurityNumber: '1',
      cardHolderName: 'h',
      cardExpiration: new Date('2030-01-01'),
    });
    o.pullDomainEvents();
    expect(() => o.setShippedStatus()).toThrow(OrderingDomainException);
  });

  test('setAwaitingValidationStatus is no-op when not Submitted', () => {
    const o = Order.newDraft();
    o.setPersistedId(1);
    o.addOrderItem(1, 'x', 1, 0, '', 1);
    o.setAwaitingValidationStatus();
    o.pullDomainEvents();
    o.setStockConfirmedStatus();
    expect(() => o.setAwaitingValidationStatus()).not.toThrow();
    expect(o.orderStatus).toBe(OrderStatus.StockConfirmed);
  });

  test('setStockConfirmedStatus is no-op when not AwaitingValidation', () => {
    const o = Order.createSubmitted({
      persistedId: 1,
      userId: 'u',
      userName: 'n',
      address: new Address('s', 'c', 'st', 'ct', 'z'),
      cardTypeId: 1,
      cardNumber: '1',
      cardSecurityNumber: '1',
      cardHolderName: 'h',
      cardExpiration: new Date('2030-01-01'),
    });
    o.pullDomainEvents();
    o.setStockConfirmedStatus();
    expect(o.orderStatus).toBe(OrderStatus.Submitted);
  });

  test('setPaidStatus is no-op when not StockConfirmed', () => {
    const o = Order.createSubmitted({
      persistedId: 1,
      userId: 'u',
      userName: 'n',
      address: new Address('s', 'c', 'st', 'ct', 'z'),
      cardTypeId: 1,
      cardNumber: '1',
      cardSecurityNumber: '1',
      cardHolderName: 'h',
      cardExpiration: new Date('2030-01-01'),
    });
    o.pullDomainEvents();
    o.setPaidStatus();
    expect(o.orderStatus).toBe(OrderStatus.Submitted);
  });

  test('setAwaitingValidationStatus throws when persisted id is unset', () => {
    const o = Order.newDraft();
    o.addOrderItem(1, 'x', 1, 0, '', 1);
    expect(() => o.setAwaitingValidationStatus()).toThrow(OrderingDomainException);
  });

  test('attachPersistedIdentity is no-op when OrderStarted missing', () => {
    const o = Order.newDraft();
    o.setPersistedId(1);
    o.attachPersistedIdentity(2);
    expect(o.id).toBe(2);
  });
});
