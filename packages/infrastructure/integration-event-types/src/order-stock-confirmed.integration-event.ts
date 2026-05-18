import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

export class OrderStockConfirmedIntegrationEvent extends IntegrationEvent {
  OrderId!: number;

  constructor(orderId?: number, id?: string, creationDate?: string) {
    super(id, creationDate);
    if (orderId !== undefined) this.OrderId = orderId;
  }

  static revive(json: IntegrationJson): OrderStockConfirmedIntegrationEvent {
    const j = json as {
      OrderId?: number;
      Id?: string;
      CreationDate?: string;
      creationDate?: string;
    };
    return new OrderStockConfirmedIntegrationEvent(
      Number(j.OrderId),
      j.Id,
      typeof j.CreationDate === 'string' ? j.CreationDate : j.creationDate,
    );
  }
}
