import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { pruneProcessedIntegrationEvents } from '@eshop/inbox';

import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class OrderingProcessedEventsGcService {
  private readonly log = new Logger(OrderingProcessedEventsGcService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async prune(): Promise<void> {
    const count = await pruneProcessedIntegrationEvents(this.prisma);
    if (count > 0) {
      this.log.log(`Retention GC deleted ${String(count)} processed_integration_events rows`);
    }
  }
}
