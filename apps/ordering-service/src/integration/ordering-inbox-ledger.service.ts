import { Injectable, Logger } from '@nestjs/common';
import { createPrismaInboxStore, releaseInbox, tryAcquireInbox, type InboxLedgerStore } from '@eshop/inbox';

import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class OrderingInboxLedgerService {
  private readonly log = new Logger(OrderingInboxLedgerService.name);
  private readonly store: InboxLedgerStore;

  constructor(private readonly prisma: PrismaService) {
    this.store = createPrismaInboxStore(this.prisma.processedIntegrationEventRow);
  }

  async tryAcquire(integrationEventId: string, consumerName: string): Promise<boolean> {
    return tryAcquireInbox(this.store, { eventId: integrationEventId, consumerName }, {
      onUnexpectedError: (err, key) => {
        this.log.error(err, `Ledger insert failed for ${key.consumerName} / ${key.eventId}`);
      },
    });
  }

  async release(integrationEventId: string, consumerName: string): Promise<void> {
    await releaseInbox(this.store, { eventId: integrationEventId, consumerName });
  }
}
