import { releaseInbox, tryAcquireInbox, type InboxLedgerOptions } from './inbox-ledger';
import type { InboxLedgerKey, InboxLedgerStore } from './inbox-ledger.port';

/**
 * Runs `handler` only when inbox acquire succeeds; releases the row on handler failure
 * so RabbitMQ redelivery can retry.
 */
export async function runWithInbox(
  store: InboxLedgerStore,
  key: InboxLedgerKey,
  handler: () => Promise<void>,
  options?: InboxLedgerOptions,
): Promise<boolean> {
  if (!(await tryAcquireInbox(store, key, options))) {
    return false;
  }
  try {
    await handler();
    return true;
  } catch (err) {
    await releaseInbox(store, key);
    throw err;
  }
}
