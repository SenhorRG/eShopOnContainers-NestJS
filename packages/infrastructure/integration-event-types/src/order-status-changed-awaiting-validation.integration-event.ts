import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

import { reviveOrderStockItem, type OrderStockItemPayload } from './order-stock-item.integration';

/** Payload matches Ordering publisher + Catalog consumer routing key (`GetType().Name`). */
export class OrderStatusChangedToAwaitingValidationIntegrationEvent extends IntegrationEvent {
  OrderId!: number;

  OrderStockItems!: OrderStockItemPayload[];

  OrderStatus?: unknown;

  BuyerName?: string;

  BuyerIdentityGuid?: string;

  constructor(
    orderId?: number,
    orderStockItems?: OrderStockItemPayload[],
    id?: string,
    creationDate?: string,
  ) {
    super(id, creationDate);
    if (orderId !== undefined) this.OrderId = orderId;
    if (orderStockItems !== undefined) this.OrderStockItems = orderStockItems;
  }

  static revive(json: IntegrationJson): OrderStatusChangedToAwaitingValidationIntegrationEvent {
    const j = json as IntegrationJson & {
      OrderStockItems?: IntegrationJson[];
      Id?: string;
      CreationDate?: string;
      creationDate?: string;
    };
    const rawItems = Array.isArray(j.OrderStockItems) ? j.OrderStockItems : [];
    const e = new OrderStatusChangedToAwaitingValidationIntegrationEvent(
      Number(j.OrderId),
      rawItems.map(reviveOrderStockItem),
      typeof j.Id === 'string' ? j.Id : undefined,
      typeof j.CreationDate === 'string'
        ? j.CreationDate
        : typeof j.creationDate === 'string'
          ? j.creationDate
          : undefined,
    );
    const rec = json as Record<string, unknown>;
    e.OrderStatus = rec.OrderStatus;
    e.BuyerName =
      typeof rec.BuyerName === 'string' ? rec.BuyerName : typeof rec.buyerName === 'string' ? rec.buyerName : undefined;
    e.BuyerIdentityGuid =
      typeof rec.BuyerIdentityGuid === 'string'
        ? rec.BuyerIdentityGuid
        : typeof rec.buyerIdentityGuid === 'string'
          ? rec.buyerIdentityGuid
          : undefined;
    return e;
  }
}
