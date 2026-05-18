export type IdempotencyRecord = {
  key: string;
  commandName: string;
  createdAt: Date;
};

/** Port for client-request / idempotency-key persistence (HTTP or worker). */
export interface IdempotencyStore {
  findByKey(key: string): Promise<IdempotencyRecord | null>;
  insert(record: IdempotencyRecord): Promise<void>;
}
