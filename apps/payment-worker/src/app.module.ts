import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventBusModule, eventBusOptionsFromEnv } from '@eshop/event-bus-amqp/nest';
import { rabbitAmqpUriFromProcessEnv } from '@eshop/event-bus-amqp';
import { HealthModule, requireProcessEnv } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { PaymentRedisModule } from './infrastructure/redis.module';
import { PaymentInboxLedgerService } from './integration/payment-inbox-ledger.service';
import { OrderStatusChangedToStockConfirmedHandler } from './integration/handlers/order-status-changed-stock-confirmed.handler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot(),
    PaymentRedisModule,
    HealthModule.register({
      postgresUrl: requireProcessEnv('ESHOP_ORDERING_DATABASE_URL'),
      rabbitUri: rabbitAmqpUriFromProcessEnv(),
      redisUrl: process.env.ESHOP_REDIS_URL,
    }),
    EventBusModule.registerAsync({
      useFactory: () =>
        eventBusOptionsFromEnv(process.env.ESHOP_EVENT_BUS_QUEUE_PAYMENT ?? 'payment-worker'),
    }),
  ],
  controllers: [],
  providers: [PaymentInboxLedgerService, OrderStatusChangedToStockConfirmedHandler],
})
export class AppModule {}
