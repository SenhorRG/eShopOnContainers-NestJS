import { Injectable, Logger } from '@nestjs/common';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import { ProductPriceChangedIntegrationEvent } from '@eshop/integration-event-types';

import { WebhookDispatcherService } from '../../application/services/webhook-dispatcher.service';
import { ProcessedIntegrationLedgerService } from '../processed-integration-ledger.service';

@Injectable()
@IntegrationEventHandler(ProductPriceChangedIntegrationEvent)
export class ProductPriceChangedWebhookConsumer implements IIntegrationEventHandler<ProductPriceChangedIntegrationEvent> {
  static readonly consumerKey = 'webhooks:ProductPriceChanged';

  private readonly log = new Logger(ProductPriceChangedWebhookConsumer.name);

  constructor(
    private readonly ledger: ProcessedIntegrationLedgerService,
    private readonly dispatcher: WebhookDispatcherService,
  ) {}

  async handle(event: ProductPriceChangedIntegrationEvent): Promise<void> {
    if (!(await this.ledger.tryAcquire(event.Id, ProductPriceChangedWebhookConsumer.consumerKey))) return;

    try {
      this.log.log(`Dispatching webhooks for ${event.constructor.name} product ${String(event.ProductId)}`);
      await this.dispatcher.dispatchCatalogPriceChanged(event);
    } catch (err) {
      await this.ledger.release(event.Id, ProductPriceChangedWebhookConsumer.consumerKey);
      throw err;
    }
  }
}
