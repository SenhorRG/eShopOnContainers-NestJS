import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { GracePeriodConfirmedIntegrationEvent } from '@eshop/integration-event-types';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';

import { SetAwaitingValidationOrderCommand } from '../../application/ordering/ordering.cqrs';
import { OrderingInboxLedgerService } from '../ordering-inbox-ledger.service';
import { runOrderingInboxConsumer } from './ordering-inbox.consumer-mixin';

@Injectable()
@IntegrationEventHandler(GracePeriodConfirmedIntegrationEvent)
export class GracePeriodConfirmedConsumer implements IIntegrationEventHandler<GracePeriodConfirmedIntegrationEvent> {
  static readonly consumerKey = 'ordering:GracePeriodConfirmed';

  constructor(
    private readonly bus: CommandBus,
    private readonly inbox: OrderingInboxLedgerService,
  ) {}

  async handle(event: GracePeriodConfirmedIntegrationEvent): Promise<void> {
    await runOrderingInboxConsumer(this.inbox, event.Id, GracePeriodConfirmedConsumer.consumerKey, async () => {
      await this.bus.execute(new SetAwaitingValidationOrderCommand(event.OrderId));
    });
  }
}
