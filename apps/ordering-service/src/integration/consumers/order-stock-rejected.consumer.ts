import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { OrderStockRejectedIntegrationEvent } from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';

import { SetStockRejectedOrderCommand } from '../../application/ordering/ordering.cqrs';
import { OrderingInboxLedgerService } from '../ordering-inbox-ledger.service';
import { runOrderingInboxConsumer } from './ordering-inbox.consumer-mixin';

@Injectable()
@IntegrationEventHandler(OrderStockRejectedIntegrationEvent)
export class OrderStockRejectedConsumer implements IIntegrationEventHandler<OrderStockRejectedIntegrationEvent> {
  static readonly consumerKey = 'ordering:OrderStockRejected';

  constructor(
    private readonly bus: CommandBus,
    private readonly inbox: OrderingInboxLedgerService,
  ) {}

  async handle(event: OrderStockRejectedIntegrationEvent): Promise<void> {
    await runOrderingInboxConsumer(this.inbox, event.Id, OrderStockRejectedConsumer.consumerKey, async () => {
      const rejected = event.OrderStockItems.filter((li) => !li.HasStock).map((li) => li.ProductId);
      await this.bus.execute(new SetStockRejectedOrderCommand(event.OrderId, rejected));
    });
  }
}
