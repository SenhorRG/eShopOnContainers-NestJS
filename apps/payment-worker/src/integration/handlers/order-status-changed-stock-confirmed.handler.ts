import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEventBus } from '@eshop/event-bus-amqp';
import type { IIntegrationEventHandler } from '@eshop/event-bus-amqp';
import { EVENT_BUS } from '@eshop/event-bus-amqp/nest';
import { IntegrationEventHandler } from '@eshop/event-bus-amqp/nest';
import {
  OrderPaymentFailedIntegrationEvent,
  OrderPaymentSucceededIntegrationEvent,
  OrderStatusChangedToStockConfirmedIntegrationEvent,
} from '@eshop/integration-event-types';

import { PaymentInboxLedgerService } from '../payment-inbox-ledger.service';

/**
 * Port of `PaymentProcessor/.../OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs`.
 * Simulated gateway only — no card data. Parity with `PaymentOptions.PaymentSucceeded` via
 * `ESHOP_PAYMENT_SIMULATE_SUCCESS` (`true`/`false`, default success).
 */
@Injectable()
@IntegrationEventHandler(OrderStatusChangedToStockConfirmedIntegrationEvent)
export class OrderStatusChangedToStockConfirmedHandler
  implements IIntegrationEventHandler<OrderStatusChangedToStockConfirmedIntegrationEvent>
{
  static readonly consumerKey = 'payment:OrderStatusChangedToStockConfirmed';

  private readonly log = new Logger(OrderStatusChangedToStockConfirmedHandler.name);

  constructor(
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
    private readonly inbox: PaymentInboxLedgerService,
  ) {}

  async handle(event: OrderStatusChangedToStockConfirmedIntegrationEvent): Promise<void> {
    if (!(await this.inbox.tryAcquire(event.Id, OrderStatusChangedToStockConfirmedHandler.consumerKey))) {
      this.log.debug(`Skipping duplicate ${event.Id}`);
      return;
    }

    this.log.log(`Handling integration event: ${event.Id} — (${event.constructor.name})`);

    const paymentSucceeded =
      (process.env.ESHOP_PAYMENT_SIMULATE_SUCCESS ?? 'true').toLowerCase() !== 'false';

    const next = paymentSucceeded
      ? new OrderPaymentSucceededIntegrationEvent(event.OrderId)
      : new OrderPaymentFailedIntegrationEvent(event.OrderId);

    this.log.log(`Publishing integration event: ${next.Id} — (${next.constructor.name})`);

    try {
      await this.bus.publish(next);
    } catch (err) {
      await this.inbox.release(event.Id, OrderStatusChangedToStockConfirmedHandler.consumerKey);
      throw err;
    }
  }
}
