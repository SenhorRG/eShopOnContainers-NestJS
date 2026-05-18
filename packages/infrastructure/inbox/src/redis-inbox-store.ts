import type { InboxLedgerKey, InboxLedgerStore } from './inbox-ledger.port';

/** Minimal Redis client surface (ioredis-compatible SET NX EX). */
export type RedisInboxClient = {
  set(key: string, value: string, expiryMode: 'EX', ttlSeconds: number, mode: 'NX'): Promise<'OK' | null>;
  del(key: string): Promise<number>;
};

export type RedisInboxStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};

const DEFAULT_PREFIX = 'eshop:inbox:';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 14;

function inboxRedisKey(prefix: string, { eventId, consumerName }: InboxLedgerKey): string {
  return `${prefix}${consumerName}:${eventId}`;
}

/** Maps ioredis `set(key, value, 'EX', ttl, 'NX')` to the inbox port. */
export function adaptIoredisInboxClient(redis: {
  set(key: string, value: string, expiryMode: 'EX', ttlSeconds: number, mode: 'NX'): Promise<string | null>;
  del(key: string): Promise<number>;
}): RedisInboxClient {
  return {
    async set(key, value, expiryMode, ttlSeconds, mode) {
      if (expiryMode !== 'EX' || mode !== 'NX') {
        throw new Error('Redis inbox adapter supports EX+NX only.');
      }
      const result = await redis.set(key, value, 'EX', ttlSeconds, 'NX');
      return result === 'OK' ? 'OK' : null;
    },
    del: (key) => redis.del(key),
  };
}

/** Redis SET NX inbox rows for services without a Prisma database (basket, payment-worker). */
export function createRedisInboxStore(
  redis: RedisInboxClient,
  options?: RedisInboxStoreOptions,
): InboxLedgerStore {
  const prefix = options?.keyPrefix ?? DEFAULT_PREFIX;
  const ttlSeconds = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  return {
    async tryInsert(key: InboxLedgerKey): Promise<void> {
      const redisKey = inboxRedisKey(prefix, key);
      const ok = await redis.set(redisKey, '1', 'EX', ttlSeconds, 'NX');
      if (ok !== 'OK') {
        const err = Object.assign(new Error('duplicate inbox key'), { code: 'P2002' });
        throw err;
      }
    },
    async delete(key: InboxLedgerKey): Promise<void> {
      await redis.del(inboxRedisKey(prefix, key));
    },
  };
}
