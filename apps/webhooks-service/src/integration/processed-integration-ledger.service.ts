import { Injectable, Logger } from '@nestjs/common';
import { createPrismaInboxStore, releaseInbox, tryAcquireInbox, type InboxLedgerStore } from '@eshop/inbox';

import { WebhooksPrismaService } from '../infrastructure/prisma/webhooks-prisma.service';

/**
 * Dedup ledger `(integration_event_id, consumer_name)` for at-least-once consumers.
 */
@Injectable()
export class ProcessedIntegrationLedgerService {
  private readonly log = new Logger(ProcessedIntegrationLedgerService.name);
  private readonly store: InboxLedgerStore;

  constructor(private readonly prisma: WebhooksPrismaService) {
    this.store = createPrismaInboxStore(this.prisma.processedIntegrationEventRow);
  }

  /** Returns `true` if this invocation should run side-effects (insert won). */
  async tryAcquire(integrationEventId: string, consumerName: string): Promise<boolean> {
    return tryAcquireInbox(this.store, { eventId: integrationEventId, consumerName }, {
      onUnexpectedError: (err, key) => {
        this.log.error(err, `Ledger insert failed for ${key.consumerName} / ${key.eventId}`);
      },
    });
  }

  /** Deletes ledger row so a failed outbound attempt can be retried on Rabbit redelivery. */
  async release(integrationEventId: string, consumerName: string): Promise<void> {
    await releaseInbox(this.store, { eventId: integrationEventId, consumerName });
  }
}
