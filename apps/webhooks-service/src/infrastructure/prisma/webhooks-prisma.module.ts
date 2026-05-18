import { Global, Module } from '@nestjs/common';

import { WebhooksPrismaService } from './webhooks-prisma.service';

@Global()
@Module({
  providers: [WebhooksPrismaService],
  exports: [WebhooksPrismaService],
})
export class WebhooksPrismaModule {}
