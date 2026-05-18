import { IntegrationEvent } from '@eshop/event-bus-amqp';

export class OrderStartedIntegrationEvent extends IntegrationEvent {
  UserId: string;

  constructor(userId: string, id?: string, creationDate?: string) {
    super(id, creationDate);
    this.UserId = userId;
  }

  static revive(body: Record<string, unknown>): OrderStartedIntegrationEvent {
    return new OrderStartedIntegrationEvent(
      String(body.UserId ?? ''),
      body.Id != null ? String(body.Id) : undefined,
      body.CreationDate != null ? String(body.CreationDate) : undefined,
    );
  }
}
