import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'node:path';

import { EventBusModule, eventBusOptionsFromEnv } from '@eshop/event-bus-amqp/nest';
import { rabbitAmqpUriFromProcessEnv } from '@eshop/event-bus-amqp';

import { OrderStatusChangedToAwaitingValidationHandler } from '../../integration/handlers/order-status-changed-to-awaiting-validation.handler';
import { OrderStatusChangedToPaidHandler } from '../../integration/handlers/order-status-changed-to-paid.handler';
import { CatalogInboxLedgerService } from '../../integration/catalog-inbox-ledger.service';
import { CatalogIntegrationEventService } from '../../integration/catalog-integration-event.service';
import { CatalogProcessedEventsGcService } from '../../integration/catalog-processed-events-gc.service';
import { CATALOG_PICS_PATH } from '../../infrastructure/pics-path.token';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { AzureOpenAiEmbeddingAdapter } from '../../application/ai/azure-openai-embedding.adapter';
import { CatalogAiOrchestrator } from '../../application/ai/catalog-ai.orchestrator';
import { NoopCatalogAiService } from '../../application/ai/noop-catalog-ai.service';
import { OllamaEmbeddingAdapter } from '../../application/ai/ollama-embedding.adapter';
import { OpenAiEmbeddingAdapter } from '../../application/ai/openai-embedding.adapter';

import { CatalogApiService } from '../../application/catalog/catalog-api.service';
import { CatalogChatController } from './catalog-chat.controller';
import { CatalogChatService } from '../../application/catalog/catalog-chat.service';
import { CatalogHttpController } from './catalog-http.controller';
import { CatalogPictureController } from './catalog-picture.controller';

const DEFAULT_QUEUE = 'catalog-api';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    EventBusModule.registerAsync({
      useFactory: () => eventBusOptionsFromEnv(process.env.ESHOP_EVENT_BUS_QUEUE_CATALOG ?? DEFAULT_QUEUE),
    }),
  ],
  controllers: [CatalogHttpController, CatalogPictureController, CatalogChatController],
  providers: [
    CatalogApiService,
    CatalogChatService,
    CatalogIntegrationEventService,
    CatalogInboxLedgerService,
    CatalogProcessedEventsGcService,
    NoopCatalogAiService,
    OpenAiEmbeddingAdapter,
    OllamaEmbeddingAdapter,
    AzureOpenAiEmbeddingAdapter,
    CatalogAiOrchestrator,
    OrderStatusChangedToAwaitingValidationHandler,
    OrderStatusChangedToPaidHandler,
    {
      provide: CATALOG_PICS_PATH,
      useFactory: () => {
        const fromEnv = process.env.CATALOG_PICS_PATH?.trim();
        if (fromEnv) return fromEnv;
        return join(process.cwd(), 'assets', 'pics');
      },
    },
  ],
})
export class CatalogModule {}
