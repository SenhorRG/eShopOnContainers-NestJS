import { Injectable, Logger } from '@nestjs/common';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import {
  OrderStatusChangedToAwaitingValidationIntegrationEvent,
  OrderStockConfirmedIntegrationEvent,
  OrderStockRejectedIntegrationEvent,
} from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import {
  orderStockHasRejection,
  validateOrderStockLines,
  type CatalogStockSnapshot,
  type StockConfirmationLine,
} from '@eshop/catalog-domain';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CatalogInboxLedgerService } from '../catalog-inbox-ledger.service';
import { CatalogIntegrationEventService } from '../catalog-integration-event.service';

@Injectable()
@IntegrationEventHandler(OrderStatusChangedToAwaitingValidationIntegrationEvent)
export class OrderStatusChangedToAwaitingValidationHandler
  implements IIntegrationEventHandler<OrderStatusChangedToAwaitingValidationIntegrationEvent>
{
  static readonly consumerKey = 'catalog:OrderStatusChangedToAwaitingValidation';

  private readonly log = new Logger(OrderStatusChangedToAwaitingValidationHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integration: CatalogIntegrationEventService,
    private readonly inbox: CatalogInboxLedgerService,
  ) {}

  async handle(event: OrderStatusChangedToAwaitingValidationIntegrationEvent): Promise<void> {
    if (!(await this.inbox.tryAcquire(event.Id, OrderStatusChangedToAwaitingValidationHandler.consumerKey))) {
      this.log.debug(`Skipping duplicate ${event.Id}`);
      return;
    }

    this.log.log(`Handling integration event ${event.Id} (${event.constructor.name})`);

    try {
      await this.handleStockValidation(event);
    } catch (err) {
      await this.inbox.release(event.Id, OrderStatusChangedToAwaitingValidationHandler.consumerKey);
      throw err;
    }
  }

  private async handleStockValidation(
    event: OrderStatusChangedToAwaitingValidationIntegrationEvent,
  ): Promise<void> {
    const snapshots = new Map<number, CatalogStockSnapshot>();

    for (const line of event.OrderStockItems) {
      const catalogItem = await this.prisma.catalogItem.findUnique({ where: { Id: line.ProductId } });
      if (!catalogItem) continue;
      snapshots.set(catalogItem.Id, {
        productId: catalogItem.Id,
        availableStock: catalogItem.AvailableStock,
      });
    }

    const confirmed = validateOrderStockLines(
      event.OrderStockItems.map((line) => ({ productId: line.ProductId, units: line.Units })),
      snapshots,
    );

    const payload = confirmed.map((line: StockConfirmationLine) => ({
      ProductId: line.productId,
      HasStock: line.hasStock,
    }));

    const outbound = orderStockHasRejection(confirmed)
      ? new OrderStockRejectedIntegrationEvent(event.OrderId, payload)
      : new OrderStockConfirmedIntegrationEvent(event.OrderId);

    await this.integration.withCatalogAndOutbox(async (_, enqueue) => {
      await enqueue(outbound);
    });
    await this.integration.publishThroughEventBusAsync(outbound);
  }
}

