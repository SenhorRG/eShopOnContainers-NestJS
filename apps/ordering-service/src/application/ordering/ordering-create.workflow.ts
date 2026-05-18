import { Injectable } from '@nestjs/common';
import type { Prisma } from '@ordering/prisma-client';
import { Address, Order } from '@eshop/ordering-domain';

import type { OrderingIntegrationEnqueue } from '../../integration/ordering-tx-context';

import { finalizeOrderStartedEnqueueBasketAndBuyer } from './finalize-order-started';
import { maskCardNumber } from './ordering-card-mask';
import type { OrderingCreateOrderPayload } from '../../api/ordering/ordering.dto';
import { OrderingPersistenceFacade } from '../../application/ordering/ordering-persistence.facade';

@Injectable()
export class OrderingCreateOrderWorkflow {
  constructor(private readonly persist: OrderingPersistenceFacade) {}

  async executeSubmitted(
    prismaTx: Prisma.TransactionClient,
    enqueue: OrderingIntegrationEnqueue,
    payload: OrderingCreateOrderPayload,
  ): Promise<boolean> {
    const maskedCc = maskCardNumber(payload.cardNumber);
    const address = new Address(payload.street, payload.city, payload.state, payload.country, payload.zipCode);

    const order = Order.createSubmitted({
      persistedId: undefined,
      userId: payload.userId,
      userName: payload.userName,
      address,
      cardTypeId: payload.cardTypeId,
      cardNumber: maskedCc,
      cardSecurityNumber: payload.cardSecurityNumber,
      cardHolderName: payload.cardHolderName,
      cardExpiration: payload.cardExpiration,
    });

    for (const raw of payload.items) {
      const discount = typeof raw.discount === 'number' ? raw.discount : 0;
      order.addOrderItem(
        raw.productId,
        raw.productName ?? '',
        raw.unitPrice ?? 0,
        discount,
        raw.pictureUrl ?? '',
        raw.units ?? 1,
      );
    }

    const id = await this.persist.insertSubmittedOrder(prismaTx, order);
    order.attachPersistedIdentity(id);

    await finalizeOrderStartedEnqueueBasketAndBuyer({ prismaTx, order, enqueueIntegrationEvent: enqueue });

    return true;
  }
}
