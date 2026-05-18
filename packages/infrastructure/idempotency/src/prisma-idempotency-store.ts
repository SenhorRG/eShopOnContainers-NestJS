import type { IdempotencyRecord, IdempotencyStore } from './idempotency-store.port';

export type PrismaIdempotencyDelegate = {
  findUnique(args: { where: { Id: string } }): Promise<{ Id: string; Name: string; Time: Date } | null>;
  create(args: { data: { Id: string; Name: string; Time: Date } }): Promise<unknown>;
};

/** Adapts Ordering-style `ClientRequest` / idempotency tables keyed by string `Id`. */
export function createPrismaIdempotencyStore(delegate: PrismaIdempotencyDelegate): IdempotencyStore {
  return {
    async findByKey(key: string): Promise<IdempotencyRecord | null> {
      const row = await delegate.findUnique({ where: { Id: key } });
      if (!row) {
        return null;
      }
      return { key: row.Id, commandName: row.Name, createdAt: row.Time };
    },
    async insert(record: IdempotencyRecord): Promise<void> {
      await delegate.create({
        data: { Id: record.key, Name: record.commandName, Time: record.createdAt },
      });
    },
  };
}
