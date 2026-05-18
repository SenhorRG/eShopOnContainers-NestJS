import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { rabbitAmqpUriFromProcessEnv } from '@eshop/event-bus-amqp';
import { HealthModule, requireProcessEnv } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { OrderingModule } from './api/ordering/ordering.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot(),
    HealthModule.register({
      postgresUrl: requireProcessEnv('ESHOP_ORDERING_DATABASE_URL'),
      rabbitUri: rabbitAmqpUriFromProcessEnv(),
    }),
    OrderingModule,
  ],
})
export class AppModule {}
