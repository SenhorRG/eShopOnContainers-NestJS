import type { Prisma } from '@ordering/prisma-client';
import type { Order } from '@eshop/ordering-domain';
import type { DomainEvent } from '@eshop/ordering-domain';
import { OrderStatusChangedToSubmittedIntegrationEvent, OrderStartedIntegrationEvent } from '@eshop/integration-event-types';

import type { OrderingIntegrationEnqueue } from '../../integration/ordering-tx-context';

/** Basket cleanup broadcast + Buyer/Payment linkage (mirrors `CreateOrderCommandHandler` + ValidateOrAddBuyer aggregate handler). */
export async function finalizeOrderStartedEnqueueBasketAndBuyer(opts: {
  prismaTx: Prisma.TransactionClient;
  order: Order;
  enqueueIntegrationEvent: OrderingIntegrationEnqueue;
}): Promise<void> {
  const { prismaTx, order, enqueueIntegrationEvent } = opts;
  const events = [...order.peekDomainEvents()];
  const oe = events.find((e): e is Extract<DomainEvent, { type: 'OrderStartedDomainEvent' }> => e.type === 'OrderStartedDomainEvent');

  if (!oe) throw new Error('Missing OrderStartedDomainEvent on new aggregate');

  await enqueueIntegrationEvent(new OrderStartedIntegrationEvent(oe.userId));

  const effectiveCardType = oe.cardTypeId && oe.cardTypeId !== 0 ? oe.cardTypeId : 1;
  const oid = order.id;
  if (oid == null) throw new Error('Order id unset before finalizeOrderStarted');

  let buyer = await prismaTx.orderingBuyer.findFirst({ where: { IdentityGuid: oe.userId } });
  const existed = buyer != null;

  if (!buyer) {
    buyer = await prismaTx.orderingBuyer.create({
      data: { IdentityGuid: oe.userId, Name: oe.userName },
    });
  }

  const methods = await prismaTx.orderingPaymentMethod.findMany({
    where: { BuyerId: buyer.Id },
  });

  const hit = methods.find(
    (m) =>
      m.CardTypeId === effectiveCardType &&
      m.CardNumber === oe.cardNumber &&
      m.Expiration.getTime() === oe.cardExpiration.getTime(),
  );

  const alias = `Payment Method on ${new Date().toISOString()}`;

  let paymentId = hit?.Id;

  if (paymentId == null) {
    const createdPay = await prismaTx.orderingPaymentMethod.create({
      data: {
        BuyerId: buyer.Id,
        Alias: alias,
        CardHolderName: oe.cardHolderName,
        CardNumber: oe.cardNumber,
        Expiration: oe.cardExpiration,
        CardTypeId: effectiveCardType,
      },
    });
    paymentId = createdPay.Id;
  }

  await prismaTx.orderingOrder.update({
    where: { Id: oid },
    data: { BuyerId: buyer.Id, PaymentMethodId: paymentId },
  });

  order.setPaymentMethodVerified(buyer.Id, paymentId);

  const buyerDisplayName = (existed ? buyer.Name : oe.userName) ?? buyer.Name ?? oe.userName;

  const submittedEvt = new OrderStatusChangedToSubmittedIntegrationEvent(
    oid,
    order.orderStatus,
    buyerDisplayName ?? '',
    buyer.IdentityGuid,
  );

  await enqueueIntegrationEvent(submittedEvt);

  order.pullDomainEvents();
}
