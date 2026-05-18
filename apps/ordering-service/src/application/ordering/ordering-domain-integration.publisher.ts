import { Injectable } from '@nestjs/common';
import type { Prisma } from '@ordering/prisma-client';
import type { DomainEvent } from '@eshop/ordering-domain';
import {
  OrderStatusChangedToAwaitingValidationIntegrationEvent,
  OrderStatusChangedToCancelledIntegrationEvent,
  OrderStatusChangedToPaidIntegrationEvent,
  OrderStatusChangedToShippedIntegrationEvent,
  OrderStatusChangedToStockConfirmedIntegrationEvent,
} from '@eshop/integration-event-types';

import type { OrderingIntegrationEnqueue } from '../../integration/ordering-tx-context';

@Injectable()
export class OrderingDomainIntegrationPublisher {
  async publishForEvents(
    prismaTx: Prisma.TransactionClient,
    enqueue: OrderingIntegrationEnqueue,
    events: DomainEvent[],
  ): Promise<void> {
    for (const e of events) {
      switch (e.type) {
        case 'OrderStatusChangedToAwaitingValidationDomainEvent':
          await this.publishAwaitingValidation(prismaTx, enqueue, e);
          break;

        case 'OrderStatusChangedToStockConfirmedDomainEvent':
          await this.publishStockConfirmed(prismaTx, enqueue, e.orderId);
          break;

        case 'OrderStatusChangedToPaidDomainEvent':
          await this.publishPaid(prismaTx, enqueue, e.orderId, e.orderItems);
          break;

        case 'OrderShippedDomainEvent':
          await this.publishShipped(prismaTx, enqueue, e.orderId);
          break;

        case 'OrderCancelledDomainEvent':
          await this.publishCancelled(prismaTx, enqueue, e.orderId);
          break;

        default:
          break;
      }
    }
  }

  private async publishAwaitingValidation(
    prismaTx: Prisma.TransactionClient,
    enqueue: OrderingIntegrationEnqueue,
    e: Extract<DomainEvent, { type: 'OrderStatusChangedToAwaitingValidationDomainEvent' }>,
  ): Promise<void> {
    const ctx = await this.loadOrderBuyer(prismaTx, e.orderId);
    const stockItems = e.orderItems.map((i: { productId: number; units: number }) => ({
      ProductId: i.productId,
      Units: i.units,
    }));
    const evt = new OrderStatusChangedToAwaitingValidationIntegrationEvent(
      ctx.order.Id,
      stockItems,
    );
    evt.OrderStatus = ctx.order.OrderStatus;
    evt.BuyerName = ctx.buyer.Name ?? '';
    evt.BuyerIdentityGuid = ctx.buyer.IdentityGuid;
    await enqueue(evt);
  }

  private async publishStockConfirmed(
    prismaTx: Prisma.TransactionClient,
    enqueue: OrderingIntegrationEnqueue,
    orderId: number,
  ): Promise<void> {
    const ctx = await this.loadOrderBuyer(prismaTx, orderId);
    const evt = new OrderStatusChangedToStockConfirmedIntegrationEvent(
      ctx.order.Id,
      ctx.order.OrderStatus,
      ctx.buyer.Name ?? '',
      ctx.buyer.IdentityGuid,
    );
    await enqueue(evt);
  }

  private async publishPaid(
    prismaTx: Prisma.TransactionClient,
    enqueue: OrderingIntegrationEnqueue,
    orderId: number,
    lines: ReadonlyArray<{ productId: number; units: number }>,
  ): Promise<void> {
    const ctx = await this.loadOrderBuyer(prismaTx, orderId);
    const evt = new OrderStatusChangedToPaidIntegrationEvent(orderId, lines.map((l) => ({ ProductId: l.productId, Units: l.units })));
    evt.OrderStatus = ctx.order.OrderStatus;
    evt.BuyerName = ctx.buyer.Name ?? '';
    evt.BuyerIdentityGuid = ctx.buyer.IdentityGuid;
    await enqueue(evt);
  }

  private async publishShipped(prismaTx: Prisma.TransactionClient, enqueue: OrderingIntegrationEnqueue, orderId: number): Promise<void> {
    const ctx = await this.loadOrderBuyer(prismaTx, orderId);
    const evt = new OrderStatusChangedToShippedIntegrationEvent(
      ctx.order.Id,
      ctx.order.OrderStatus,
      ctx.buyer.Name ?? '',
      ctx.buyer.IdentityGuid,
    );
    await enqueue(evt);
  }

  private async publishCancelled(
    prismaTx: Prisma.TransactionClient,
    enqueue: OrderingIntegrationEnqueue,
    orderId: number,
  ): Promise<void> {
    const ctx = await this.loadOrderBuyer(prismaTx, orderId);
    const evt = new OrderStatusChangedToCancelledIntegrationEvent(
      ctx.order.Id,
      ctx.order.OrderStatus,
      ctx.buyer.Name ?? '',
      ctx.buyer.IdentityGuid,
    );
    await enqueue(evt);
  }

  private async loadOrderBuyer(prismaTx: Prisma.TransactionClient, orderId: number) {
    const order = await prismaTx.orderingOrder.findUniqueOrThrow({
      where: { Id: orderId },
      include: { buyer: true },
    });
    const buyerRow = order.buyer;
    if (order.BuyerId == null || buyerRow == null) {
      throw new Error(`Order ${orderId} lacks buyer linkage required for outbound integration events`);
    }

    return {
      order,
      buyer: buyerRow,
    };
  }
}
