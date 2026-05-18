import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

import { reviveOrderStockItem, type OrderStockItemPayload } from './order-stock-item.integration';

export class OrderStatusChangedToPaidIntegrationEvent extends IntegrationEvent {
  OrderId!: number;

  OrderStockItems!: OrderStockItemPayload[];

  /** Stringified order status at publish time. */
  OrderStatus?: string | number;

  BuyerName?: string;

  BuyerIdentityGuid?: string;

  constructor(
    orderId?: number,
    orderStockItems?: OrderStockItemPayload[],
    id?: string,
    creationDate?: string,
    orderStatus?: string | number,
    buyerName?: string,
    buyerIdentityGuid?: string,
  ) {
    super(id, creationDate);
    if (orderId !== undefined) this.OrderId = orderId;
    if (orderStockItems !== undefined) this.OrderStockItems = orderStockItems;
    if (orderStatus !== undefined) this.OrderStatus = orderStatus;
    if (buyerName !== undefined) this.BuyerName = buyerName;
    if (buyerIdentityGuid !== undefined) this.BuyerIdentityGuid = buyerIdentityGuid;
  }

  static revive(json: IntegrationJson): OrderStatusChangedToPaidIntegrationEvent {
    const j = json as IntegrationJson & {
      OrderStockItems?: IntegrationJson[];
      Id?: string;
      CreationDate?: string;
      creationDate?: string;
    };
    const rawItems = Array.isArray(j.OrderStockItems) ? j.OrderStockItems : [];
    const rec = json as Record<string, unknown>;
    return new OrderStatusChangedToPaidIntegrationEvent(
      Number(j.OrderId),
      rawItems.map(reviveOrderStockItem),
      typeof j.Id === 'string' ? j.Id : undefined,
      typeof j.CreationDate === 'string'
        ? j.CreationDate
        : typeof j.creationDate === 'string'
          ? j.creationDate
          : undefined,
      rec.OrderStatus as string | number | undefined,
      typeof rec.BuyerName === 'string' ? rec.BuyerName : undefined,
      typeof rec.BuyerIdentityGuid === 'string'
        ? rec.BuyerIdentityGuid
        : typeof rec.buyerIdentityGuid === 'string'
          ? rec.buyerIdentityGuid
          : undefined,
    );
  }
}
