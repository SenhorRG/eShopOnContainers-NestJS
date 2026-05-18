import { describe, expect, it } from 'vitest';

import { createIdempotencyIfAbsent, idempotencyKeyExists } from './idempotency';
import type { IdempotencyRecord, IdempotencyStore } from './idempotency-store.port';

function memoryStore(): IdempotencyStore & { records: Map<string, IdempotencyRecord> } {
  const records = new Map<string, IdempotencyRecord>();
  return {
    records,
    async findByKey(key) {
      return records.get(key) ?? null;
    },
    async insert(record) {
      records.set(record.key, record);
    },
  };
}

describe('idempotency', () => {
  it('createIfAbsent returns true only on first insert', async () => {
    const store = memoryStore();
    expect(await createIdempotencyIfAbsent(store, 'req-1', 'CreateOrder')).toBe(true);
    expect(await createIdempotencyIfAbsent(store, 'req-1', 'CreateOrder')).toBe(false);
    expect(await idempotencyKeyExists(store, 'req-1')).toBe(true);
  });
});
