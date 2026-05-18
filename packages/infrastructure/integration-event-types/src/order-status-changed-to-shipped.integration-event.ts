import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

export class OrderStatusChangedToShippedIntegrationEvent extends IntegrationEvent {
  OrderId!: number;

  OrderStatus?: string | number;

  BuyerName!: string;

  BuyerIdentityGuid!: string;

  constructor(
    orderId?: number,
    orderStatus?: string | number,
    buyerName?: string,
    buyerIdentityGuid?: string,
    id?: string,
    creationDate?: string,
  ) {
    super(id, creationDate);
    if (orderId !== undefined) this.OrderId = orderId;
    if (orderStatus !== undefined) this.OrderStatus = orderStatus;
    if (buyerName !== undefined) this.BuyerName = buyerName;
    if (buyerIdentityGuid !== undefined) this.BuyerIdentityGuid = buyerIdentityGuid;
  }

  static revive(json: IntegrationJson): OrderStatusChangedToShippedIntegrationEvent {
    const rec = json as Record<string, unknown>;
    return new OrderStatusChangedToShippedIntegrationEvent(
      Number(rec.OrderId),
      rec.OrderStatus as string | number | undefined,
      typeof rec.BuyerName === 'string' ? rec.BuyerName : '',
      typeof rec.BuyerIdentityGuid === 'string' ? rec.BuyerIdentityGuid : '',
      typeof rec.Id === 'string' ? rec.Id : undefined,
      typeof rec.CreationDate === 'string'
        ? rec.CreationDate
        : typeof rec.creationDate === 'string'
          ? rec.creationDate
          : undefined,
    );
  }
}
