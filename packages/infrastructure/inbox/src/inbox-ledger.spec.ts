import { describe, expect, it, vi } from 'vitest';

import { releaseInbox, tryAcquireInbox } from './inbox-ledger';
import type { InboxLedgerStore } from './inbox-ledger.port';

function memoryStore(): InboxLedgerStore & { rows: Set<string> } {
  const rows = new Set<string>();
  const key = (eventId: string, consumerName: string) => `${eventId}:${consumerName}`;
  return {
    rows,
    async tryInsert({ eventId, consumerName }) {
      const k = key(eventId, consumerName);
      if (rows.has(k)) {
        const err = Object.assign(new Error('unique'), { code: 'P2002' });
        throw err;
      }
      rows.add(k);
    },
    async delete({ eventId, consumerName }) {
      rows.delete(key(eventId, consumerName));
    },
  };
}

describe('inbox ledger', () => {
  it('acquires once then rejects duplicate', async () => {
    const store = memoryStore();
    expect(await tryAcquireInbox(store, { eventId: 'e1', consumerName: 'c1' })).toBe(true);
    expect(await tryAcquireInbox(store, { eventId: 'e1', consumerName: 'c1' })).toBe(false);
  });

  it('release allows re-acquire', async () => {
    const store = memoryStore();
    await tryAcquireInbox(store, { eventId: 'e1', consumerName: 'c1' });
    await releaseInbox(store, { eventId: 'e1', consumerName: 'c1' });
    expect(await tryAcquireInbox(store, { eventId: 'e1', consumerName: 'c1' })).toBe(true);
  });

  it('rethrows non-unique errors', async () => {
    const store: InboxLedgerStore = {
      tryInsert: vi.fn().mockRejectedValue(new Error('db down')),
      delete: vi.fn(),
    };
    await expect(tryAcquireInbox(store, { eventId: 'e1', consumerName: 'c1' })).rejects.toThrow('db down');
  });
});
