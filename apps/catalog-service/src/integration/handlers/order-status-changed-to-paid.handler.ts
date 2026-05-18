import { Injectable, Logger } from '@nestjs/common';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { OrderStatusChangedToPaidIntegrationEvent } from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import { subtractAvailableStock } from '@eshop/catalog-domain';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CatalogInboxLedgerService } from '../catalog-inbox-ledger.service';

@Injectable()
@IntegrationEventHandler(OrderStatusChangedToPaidIntegrationEvent)
export class OrderStatusChangedToPaidHandler
  implements IIntegrationEventHandler<OrderStatusChangedToPaidIntegrationEvent>
{
  static readonly consumerKey = 'catalog:OrderStatusChangedToPaid';

  private readonly log = new Logger(OrderStatusChangedToPaidHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: CatalogInboxLedgerService,
  ) {}

  async handle(event: OrderStatusChangedToPaidIntegrationEvent): Promise<void> {
    if (!(await this.inbox.tryAcquire(event.Id, OrderStatusChangedToPaidHandler.consumerKey))) {
      this.log.debug(`Skipping duplicate ${event.Id}`);
      return;
    }

    this.log.log(`Handling integration event ${event.Id} (${event.constructor.name})`);

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const line of event.OrderStockItems) {
          const row = await tx.catalogItem.findUnique({ where: { Id: line.ProductId } });
          if (!row) continue;
          const removed = subtractAvailableStock(row.AvailableStock, line.Units, row.Name);
          await tx.catalogItem.update({
            where: { Id: row.Id },
            data: { AvailableStock: row.AvailableStock - removed },
          });
        }
      });
    } catch (err) {
      await this.inbox.release(event.Id, OrderStatusChangedToPaidHandler.consumerKey);
      throw err;
    }
  }
}
