import { describe, expect, it } from 'vitest';
import { createRedisInboxStore, tryAcquireInbox, type RedisInboxClient } from '@eshop/inbox';

function mockRedis(): RedisInboxClient {
  const keys = new Map<string, string>();
  return {
    async set(key, _value, _expiryMode, _ttl, mode) {
      if (mode !== 'NX' || keys.has(key)) return null;
      keys.set(key, '1');
      return 'OK';
    },
    async del(key) {
      return keys.delete(key) ? 1 : 0;
    },
  };
}

describe('Basket inbox ledger (redis)', () => {
  it('deduplicates the same integration event id', async () => {
    const store = createRedisInboxStore(mockRedis());
    const key = { eventId: '11111111-1111-1111-1111-111111111111', consumerName: 'basket:OrderStarted' };
    expect(await tryAcquireInbox(store, key)).toBe(true);
    expect(await tryAcquireInbox(store, key)).toBe(false);
  });
});
