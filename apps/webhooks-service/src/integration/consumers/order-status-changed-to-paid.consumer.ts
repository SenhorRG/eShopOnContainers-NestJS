import { Injectable, Logger } from '@nestjs/common';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import { OrderStatusChangedToPaidIntegrationEvent } from '@eshop/integration-event-types';

import { WebhookDispatcherService } from '../../application/services/webhook-dispatcher.service';
import { ProcessedIntegrationLedgerService } from '../processed-integration-ledger.service';

@Injectable()
@IntegrationEventHandler(OrderStatusChangedToPaidIntegrationEvent)
export class OrderStatusPaidWebhookConsumer implements IIntegrationEventHandler<OrderStatusChangedToPaidIntegrationEvent> {
  static readonly consumerKey = 'webhooks:OrderStatusChangedToPaid';

  private readonly log = new Logger(OrderStatusPaidWebhookConsumer.name);

  constructor(
    private readonly ledger: ProcessedIntegrationLedgerService,
    private readonly dispatcher: WebhookDispatcherService,
  ) {}

  async handle(event: OrderStatusChangedToPaidIntegrationEvent): Promise<void> {
    if (!(await this.ledger.tryAcquire(event.Id, OrderStatusPaidWebhookConsumer.consumerKey))) return;

    try {
      this.log.log(`Dispatching webhooks for ${event.constructor.name} order ${String(event.OrderId)}`);
      await this.dispatcher.dispatchOrderPaid(event);
    } catch (err) {
      await this.ledger.release(event.Id, OrderStatusPaidWebhookConsumer.consumerKey);
      throw err;
    }
  }
}
