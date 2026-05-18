import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { pruneProcessedIntegrationEvents } from '@eshop/inbox';

import { WebhooksPrismaService } from '../infrastructure/prisma/webhooks-prisma.service';

/** Retention job — trims old ledger rows while keeping uniqueness window practical. */
@Injectable()
export class ProcessedEventsGcService {
  private readonly log = new Logger(ProcessedEventsGcService.name);

  constructor(private readonly prisma: WebhooksPrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async prune(): Promise<void> {
    const count = await pruneProcessedIntegrationEvents(this.prisma);
    if (count > 0) {
      this.log.log(`Retention GC deleted ${String(count)} processed_integration_events rows`);
    }
  }
}
