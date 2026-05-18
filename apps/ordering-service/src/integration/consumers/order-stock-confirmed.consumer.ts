import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { OrderStockConfirmedIntegrationEvent } from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';

import { SetStockConfirmedOrderCommand } from '../../application/ordering/ordering.cqrs';
import { OrderingInboxLedgerService } from '../ordering-inbox-ledger.service';
import { runOrderingInboxConsumer } from './ordering-inbox.consumer-mixin';

@Injectable()
@IntegrationEventHandler(OrderStockConfirmedIntegrationEvent)
export class OrderStockConfirmedConsumer implements IIntegrationEventHandler<OrderStockConfirmedIntegrationEvent> {
  static readonly consumerKey = 'ordering:OrderStockConfirmed';

  constructor(
    private readonly bus: CommandBus,
    private readonly inbox: OrderingInboxLedgerService,
  ) {}

  async handle(event: OrderStockConfirmedIntegrationEvent): Promise<void> {
    await runOrderingInboxConsumer(this.inbox, event.Id, OrderStockConfirmedConsumer.consumerKey, async () => {
      await this.bus.execute(new SetStockConfirmedOrderCommand(event.OrderId));
    });
  }
}
