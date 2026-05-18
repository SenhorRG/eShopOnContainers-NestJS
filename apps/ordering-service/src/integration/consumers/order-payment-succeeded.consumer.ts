import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { OrderPaymentSucceededIntegrationEvent } from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';

import { SetPaidOrderCommand } from '../../application/ordering/ordering.cqrs';
import { OrderingInboxLedgerService } from '../ordering-inbox-ledger.service';
import { runOrderingInboxConsumer } from './ordering-inbox.consumer-mixin';

@Injectable()
@IntegrationEventHandler(OrderPaymentSucceededIntegrationEvent)
export class OrderPaymentSucceededConsumer implements IIntegrationEventHandler<OrderPaymentSucceededIntegrationEvent> {
  static readonly consumerKey = 'ordering:OrderPaymentSucceeded';

  constructor(
    private readonly bus: CommandBus,
    private readonly inbox: OrderingInboxLedgerService,
  ) {}

  async handle(event: OrderPaymentSucceededIntegrationEvent): Promise<void> {
    await runOrderingInboxConsumer(this.inbox, event.Id, OrderPaymentSucceededConsumer.consumerKey, async () => {
      await this.bus.execute(new SetPaidOrderCommand(event.OrderId));
    });
  }
}
