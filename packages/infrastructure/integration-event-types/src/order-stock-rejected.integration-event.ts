import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

import { reviveConfirmedItems, type ConfirmedOrderStockItemPayload } from './confirmed-order-stock-item';

export class OrderStockRejectedIntegrationEvent extends IntegrationEvent {
  OrderId!: number;

  OrderStockItems!: ConfirmedOrderStockItemPayload[];

  constructor(
    orderId?: number,
    orderStockItems?: ConfirmedOrderStockItemPayload[],
    id?: string,
    creationDate?: string,
  ) {
    super(id, creationDate);
    if (orderId !== undefined) this.OrderId = orderId;
    if (orderStockItems !== undefined) this.OrderStockItems = orderStockItems;
  }

  static revive(json: IntegrationJson): OrderStockRejectedIntegrationEvent {
    const j = json as {
      OrderId?: number;
      OrderStockItems?: IntegrationJson[];
      Id?: string;
      CreationDate?: string;
      creationDate?: string;
    };
    const itemsRaw = Array.isArray(j.OrderStockItems) ? j.OrderStockItems : [];
    return new OrderStockRejectedIntegrationEvent(
      Number(j.OrderId),
      reviveConfirmedItems(itemsRaw),
      j.Id,
      typeof j.CreationDate === 'string' ? j.CreationDate : j.creationDate,
    );
  }
}
