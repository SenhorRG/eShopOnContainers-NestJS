import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule, eventBusOptionsFromEnv } from '@eshop/event-bus-amqp/nest';
import { rabbitAmqpUriFromProcessEnv } from '@eshop/event-bus-amqp';
import { HealthModule, requireProcessEnv } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { GracePeriodManagerService } from './application/grace-period.manager';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot(),
    HealthModule.register({
      postgresUrl: requireProcessEnv('ESHOP_ORDERING_DATABASE_URL'),
      rabbitUri: rabbitAmqpUriFromProcessEnv(),
    }),
    EventBusModule.registerAsync({
      useFactory: () =>
        eventBusOptionsFromEnv(
          process.env.ESHOP_EVENT_BUS_QUEUE_ORDER_GRACE ?? 'order-grace-worker',
        ),
    }),
  ],
  controllers: [],
  providers: [GracePeriodManagerService],
})
export class AppModule {}
