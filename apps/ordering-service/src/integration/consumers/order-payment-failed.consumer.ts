import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { OrderPaymentFailedIntegrationEvent } from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';

import { CancelPlainOrderCommand } from '../../application/ordering/ordering.cqrs';
import { OrderingInboxLedgerService } from '../ordering-inbox-ledger.service';
import { runOrderingInboxConsumer } from './ordering-inbox.consumer-mixin';

@Injectable()
@IntegrationEventHandler(OrderPaymentFailedIntegrationEvent)
export class OrderPaymentFailedConsumer implements IIntegrationEventHandler<OrderPaymentFailedIntegrationEvent> {
  static readonly consumerKey = 'ordering:OrderPaymentFailed';

  constructor(
    private readonly bus: CommandBus,
    private readonly inbox: OrderingInboxLedgerService,
  ) {}

  async handle(event: OrderPaymentFailedIntegrationEvent): Promise<void> {
    await runOrderingInboxConsumer(this.inbox, event.Id, OrderPaymentFailedConsumer.consumerKey, async () => {
      await this.bus.execute(new CancelPlainOrderCommand(event.OrderId));
    });
  }
}
