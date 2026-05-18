import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import { OrderStartedIntegrationEvent } from '@eshop/integration-event-types';

import { BASKET_REPOSITORY } from '../application/basket/basket.tokens';
import type { BasketRepositoryPort } from '../application/basket/ports/basket-repository.port';
import { BasketInboxLedgerService } from './basket-inbox-ledger.service';

@Injectable()
@IntegrationEventHandler(OrderStartedIntegrationEvent)
export class OrderStartedIntegrationEventHandler implements IIntegrationEventHandler<OrderStartedIntegrationEvent> {
  static readonly consumerKey = 'basket:OrderStarted';

  private readonly log = new Logger(OrderStartedIntegrationEventHandler.name);

  constructor(
    @Inject(BASKET_REPOSITORY) private readonly baskets: BasketRepositoryPort,
    private readonly inbox: BasketInboxLedgerService,
  ) {}

  async handle(event: OrderStartedIntegrationEvent): Promise<void> {
    if (!(await this.inbox.tryAcquire(event.Id, OrderStartedIntegrationEventHandler.consumerKey))) {
      this.log.debug(`Skipping duplicate ${event.Id}`);
      return;
    }

    this.log.log(`Handling integration event ${event.Id}: OrderStartedIntegrationEvent`);

    try {
      await this.baskets.deleteBasketAsync(event.UserId);
    } catch (err) {
      await this.inbox.release(event.Id, OrderStartedIntegrationEventHandler.consumerKey);
      throw err;
    }
  }
}
