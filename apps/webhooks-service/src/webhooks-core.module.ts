import { Module } from '@nestjs/common';

import { WebhooksPrismaModule } from './infrastructure/prisma/webhooks-prisma.module';
import { GrantUrlTesterService } from './application/services/grant-url-tester.service';
import { WebhookDispatcherService } from './application/services/webhook-dispatcher.service';
import { WebhooksRetrieverService } from './application/services/webhooks-retriever.service';
import { WebhooksSenderService } from './application/services/webhooks-sender.service';

@Module({
  imports: [WebhooksPrismaModule],
  providers: [
    WebhooksRetrieverService,
    GrantUrlTesterService,
    WebhooksSenderService,
    WebhookDispatcherService,
  ],
  exports: [
    WebhooksRetrieverService,
    GrantUrlTesterService,
    WebhooksSenderService,
    WebhookDispatcherService,
  ],
})
export class WebhooksCoreModule {}
