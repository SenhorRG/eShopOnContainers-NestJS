export type InboxLedgerKey = {
  eventId: string;
  consumerName: string;
};

/** Persistence port for `(integration_event_id, consumer_name)` consumer inbox rows. */
export interface InboxLedgerStore {
  tryInsert(key: InboxLedgerKey): Promise<void>;
  delete(key: InboxLedgerKey): Promise<void>;
}
