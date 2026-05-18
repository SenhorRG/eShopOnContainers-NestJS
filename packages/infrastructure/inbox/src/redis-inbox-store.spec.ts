import { describe, expect, it } from 'vitest';

import { tryAcquireInbox } from './inbox-ledger';
import { createRedisInboxStore, type RedisInboxClient } from './redis-inbox-store';

function mockRedis(): RedisInboxClient & { keys: Map<string, string> } {
  const keys = new Map<string, string>();
  return {
    keys,
    async set(key, _value, _expiryMode, _ttl, mode) {
      if (mode !== 'NX') return null;
      if (keys.has(key)) return null;
      keys.set(key, '1');
      return 'OK';
    },
    async del(key) {
      return keys.delete(key) ? 1 : 0;
    },
  };
}

describe('createRedisInboxStore', () => {
  it('rejects duplicate (eventId, consumer) keys', async () => {
    const redis = mockRedis();
    const store = createRedisInboxStore(redis, { keyPrefix: 'test:', ttlSeconds: 60 });
    expect(await tryAcquireInbox(store, { eventId: 'e1', consumerName: 'basket:OrderStarted' })).toBe(true);
    expect(await tryAcquireInbox(store, { eventId: 'e1', consumerName: 'basket:OrderStarted' })).toBe(false);
  });
});
