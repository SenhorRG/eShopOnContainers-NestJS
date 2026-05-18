import { isUniqueConstraintViolation } from './is-unique-violation';
import type { InboxLedgerKey, InboxLedgerStore } from './inbox-ledger.port';

export type InboxLedgerOptions = {
  onUnexpectedError?: (err: unknown, key: InboxLedgerKey) => void;
};

/**
 * Returns `true` when this consumer invocation should run side-effects (insert won).
 * Duplicate deliveries return `false` without throwing.
 */
export async function tryAcquireInbox(
  store: InboxLedgerStore,
  key: InboxLedgerKey,
  options?: InboxLedgerOptions,
): Promise<boolean> {
  try {
    await store.tryInsert(key);
    return true;
  } catch (err: unknown) {
    if (isUniqueConstraintViolation(err)) {
      return false;
    }
    options?.onUnexpectedError?.(err, key);
    throw err;
  }
}

/** Removes the inbox row so a failed handler can be retried on broker redelivery. */
export async function releaseInbox(store: InboxLedgerStore, key: InboxLedgerKey): Promise<void> {
  await store.delete(key);
}
