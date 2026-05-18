import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  adaptIoredisInboxClient,
  createRedisInboxStore,
  releaseInbox,
  tryAcquireInbox,
  type InboxLedgerKey,
  type InboxLedgerStore,
} from '@eshop/inbox';
import { createRedisInboxMeters } from '@eshop/observability';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '../application/basket/basket.tokens';

@Injectable()
export class BasketInboxLedgerService {
  private readonly log = new Logger(BasketInboxLedgerService.name);
  private readonly store: InboxLedgerStore;
  private readonly inboxMeters = createRedisInboxMeters('eshop.basket.inbox.redis');

  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    this.store = createRedisInboxStore(adaptIoredisInboxClient(redis));
  }

  async tryAcquire(integrationEventId: string, consumerName: string): Promise<boolean> {
    const acquired = await tryAcquireInbox(this.store, { eventId: integrationEventId, consumerName }, {
      onUnexpectedError: (err: unknown, key: InboxLedgerKey) => {
        this.inboxMeters.errors.add(1, { consumer: key.consumerName });
        this.log.error(err, `Redis inbox failed for ${key.consumerName} / ${key.eventId}`);
      },
    });
    if (acquired) {
      this.inboxMeters.acquired.add(1, { consumer: consumerName });
    } else {
      this.inboxMeters.duplicate.add(1, { consumer: consumerName });
    }
    return acquired;
  }

  async release(integrationEventId: string, consumerName: string): Promise<void> {
    await releaseInbox(this.store, { eventId: integrationEventId, consumerName });
  }
}
