import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule, eventBusOptionsFromEnv } from '@eshop/event-bus-amqp/nest';
import { rabbitAmqpUriFromProcessEnv } from '@eshop/event-bus-amqp';
import { HealthModule, requireProcessEnv } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { WebhooksIntegrationModule } from './integration/webhooks-integration.module';
import { WebhooksHttpModule } from './api/http/webhooks-http.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot(),
    HealthModule.register({
      postgresUrl: requireProcessEnv('ESHOP_WEBHOOKS_DATABASE_URL'),
      rabbitUri: rabbitAmqpUriFromProcessEnv(),
    }),
    EventBusModule.registerAsync({
      useFactory: () =>
        eventBusOptionsFromEnv(process.env.ESHOP_EVENT_BUS_QUEUE_WEBHOOKS ?? 'webhooks-api'),
    }),
    WebhooksHttpModule,
    WebhooksIntegrationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
