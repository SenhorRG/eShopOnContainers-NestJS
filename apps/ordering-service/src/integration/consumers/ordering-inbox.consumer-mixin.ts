import type { OrderingInboxLedgerService } from '../ordering-inbox-ledger.service';

/** Shared acquire / release wrapper for ordering AMQP consumers. */
export async function runOrderingInboxConsumer(
  inbox: OrderingInboxLedgerService,
  eventId: string,
  consumerKey: string,
  handler: () => Promise<void>,
): Promise<void> {
  if (!(await inbox.tryAcquire(eventId, consumerKey))) return;
  try {
    await handler();
  } catch (err) {
    await inbox.release(eventId, consumerKey);
    throw err;
  }
}
