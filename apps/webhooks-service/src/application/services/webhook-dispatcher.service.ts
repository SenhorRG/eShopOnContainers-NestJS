import { Injectable, Logger } from '@nestjs/common';
import type {
  OrderStatusChangedToPaidIntegrationEvent,
  OrderStatusChangedToShippedIntegrationEvent,
  ProductPriceChangedIntegrationEvent,
} from '@eshop/integration-event-types';

import { buildWebhookWirePayload } from '../domain/webhook-data';
import { WebhookType } from '../domain/webhook-type';

import { WebhooksRetrieverService } from './webhooks-retriever.service';
import { WebhooksSenderService } from './webhooks-sender.service';

/**
 * Dispatches integration events to registered outbound HTTP subscribers.
 *
 * Per-delivery persistence is **not** present in the reference core — retries rely on HTTP resilience only.
 * Duplicate inbound deliveries remain guarded by `ProcessedIntegrationLedgerService` at consumers.
 */
@Injectable()
export class WebhookDispatcherService {
  private readonly log = new Logger(WebhookDispatcherService.name);

  constructor(
    private readonly retriever: WebhooksRetrieverService,
    private readonly sender: WebhooksSenderService,
  ) {}

  async dispatchCatalogPriceChanged(event: ProductPriceChangedIntegrationEvent): Promise<void> {
    const subscriptions = await this.retriever.getSubscriptionsOfType(WebhookType.CatalogItemPriceChange);
    this.log.log(`Dispatch ProductPriceChanged — subscriptions=${String(subscriptions.length)}`);
    const wire = buildWebhookWirePayload(WebhookType.CatalogItemPriceChange, event);
    await this.sender.sendAll(subscriptions, wire);
  }

  async dispatchOrderShipped(event: OrderStatusChangedToShippedIntegrationEvent): Promise<void> {
    const subscriptions = await this.retriever.getSubscriptionsOfType(WebhookType.OrderShipped);
    this.log.log(`Dispatch OrderShipped — subscriptions=${String(subscriptions.length)}`);
    const wire = buildWebhookWirePayload(WebhookType.OrderShipped, event);
    await this.sender.sendAll(subscriptions, wire);
  }

  async dispatchOrderPaid(event: OrderStatusChangedToPaidIntegrationEvent): Promise<void> {
    const subscriptions = await this.retriever.getSubscriptionsOfType(WebhookType.OrderPaid);
    this.log.log(`Dispatch OrderPaid — subscriptions=${String(subscriptions.length)}`);
    const wire = buildWebhookWirePayload(WebhookType.OrderPaid, event);
    await this.sender.sendAll(subscriptions, wire);
  }
}
