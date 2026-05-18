import { Injectable, Logger } from '@nestjs/common';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import { OrderStatusChangedToShippedIntegrationEvent } from '@eshop/integration-event-types';

import { WebhookDispatcherService } from '../../application/services/webhook-dispatcher.service';
import { ProcessedIntegrationLedgerService } from '../processed-integration-ledger.service';

@Injectable()
@IntegrationEventHandler(OrderStatusChangedToShippedIntegrationEvent)
export class OrderStatusShippedWebhookConsumer implements IIntegrationEventHandler<OrderStatusChangedToShippedIntegrationEvent> {
  static readonly consumerKey = 'webhooks:OrderStatusChangedToShipped';

  private readonly log = new Logger(OrderStatusShippedWebhookConsumer.name);

  constructor(
    private readonly ledger: ProcessedIntegrationLedgerService,
    private readonly dispatcher: WebhookDispatcherService,
  ) {}

  async handle(event: OrderStatusChangedToShippedIntegrationEvent): Promise<void> {
    if (!(await this.ledger.tryAcquire(event.Id, OrderStatusShippedWebhookConsumer.consumerKey))) return;

    try {
      this.log.log(`Dispatching webhooks for ${event.constructor.name} order ${String(event.OrderId)}`);
      await this.dispatcher.dispatchOrderShipped(event);
    } catch (err) {
      await this.ledger.release(event.Id, OrderStatusShippedWebhookConsumer.consumerKey);
      throw err;
    }
  }
}
