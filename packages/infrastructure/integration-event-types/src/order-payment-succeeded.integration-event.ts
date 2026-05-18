import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

export class OrderPaymentSucceededIntegrationEvent extends IntegrationEvent {
  OrderId!: number;

  constructor(orderId?: number, id?: string, creationDate?: string) {
    super(id, creationDate);
    if (orderId !== undefined) this.OrderId = orderId;
  }

  static revive(json: IntegrationJson): OrderPaymentSucceededIntegrationEvent {
    const rec = json as Record<string, unknown>;
    return new OrderPaymentSucceededIntegrationEvent(
      Number(rec.OrderId),
      typeof rec.Id === 'string' ? rec.Id : undefined,
      typeof rec.CreationDate === 'string'
        ? rec.CreationDate
        : typeof rec.creationDate === 'string'
          ? rec.creationDate
          : undefined,
    );
  }
}
