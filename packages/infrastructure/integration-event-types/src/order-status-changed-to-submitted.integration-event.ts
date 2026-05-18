import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

export class OrderStatusChangedToSubmittedIntegrationEvent extends IntegrationEvent {
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

  static revive(json: IntegrationJson): OrderStatusChangedToSubmittedIntegrationEvent {
    const rec = json as Record<string, unknown>;
    return new OrderStatusChangedToSubmittedIntegrationEvent(
      Number(rec.OrderId),
      rec.OrderStatus as string | number | undefined,
      typeof rec.BuyerName === 'string' ? rec.BuyerName : String(rec.BuyerName ?? ''),
      typeof rec.BuyerIdentityGuid === 'string'
        ? rec.BuyerIdentityGuid
        : String(rec.BuyerIdentityGuid ?? ''),
      typeof rec.Id === 'string' ? rec.Id : undefined,
      typeof rec.CreationDate === 'string'
        ? rec.CreationDate
        : typeof rec.creationDate === 'string'
          ? rec.creationDate
          : undefined,
    );
  }
}
