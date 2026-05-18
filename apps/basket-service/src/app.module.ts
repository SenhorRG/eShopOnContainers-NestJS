import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { rabbitAmqpUriFromProcessEnv } from '@eshop/event-bus-amqp';
import { HealthModule } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { BasketModule } from './application/basket/basket.module';

const DEFAULT_REDIS = 'redis://127.0.0.1:56379';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot(),
    HealthModule.register({
      redisUrl: process.env.ESHOP_REDIS_URL ?? DEFAULT_REDIS,
      rabbitUri: rabbitAmqpUriFromProcessEnv(),
    }),
    BasketModule,
  ],
})
export class AppModule {}
