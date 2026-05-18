import type { IdempotencyStore } from './idempotency-store.port';

export async function idempotencyKeyExists(store: IdempotencyStore, key: string): Promise<boolean> {
  const found = await store.findByKey(key);
  return found != null;
}

/**
 * Inserts the idempotency key when absent.
 * @returns `true` when the caller should execute business logic; `false` when the key already exists.
 */
export async function createIdempotencyIfAbsent(
  store: IdempotencyStore,
  key: string,
  commandName: string,
): Promise<boolean> {
  const exists = await idempotencyKeyExists(store, key);
  if (exists) {
    return false;
  }

  await store.insert({ key, commandName, createdAt: new Date() });
  return true;
}
