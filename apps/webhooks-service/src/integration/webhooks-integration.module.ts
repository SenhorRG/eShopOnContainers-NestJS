import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { WebhooksPrismaModule } from '../infrastructure/prisma/webhooks-prisma.module';
import { WebhooksCoreModule } from '../webhooks-core.module';

import { OrderStatusPaidWebhookConsumer } from './consumers/order-status-changed-to-paid.consumer';
import { OrderStatusShippedWebhookConsumer } from './consumers/order-status-changed-to-shipped.consumer';
import { ProductPriceChangedWebhookConsumer } from './consumers/product-price-changed.consumer';
import { ProcessedEventsGcService } from './processed-events-gc.service';
import { ProcessedIntegrationLedgerService } from './processed-integration-ledger.service';

@Module({
  imports: [WebhooksPrismaModule, WebhooksCoreModule, ScheduleModule.forRoot()],
  providers: [
    ProcessedIntegrationLedgerService,
    ProcessedEventsGcService,
    ProductPriceChangedWebhookConsumer,
    OrderStatusShippedWebhookConsumer,
    OrderStatusPaidWebhookConsumer,
  ],
})
export class WebhooksIntegrationModule {}
