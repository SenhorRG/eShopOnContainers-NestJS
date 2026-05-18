import type { InboxLedgerKey, InboxLedgerStore } from './inbox-ledger.port';

export type PrismaInboxDelegate = {
  create(args: { data: { integrationEventId: string; consumerName: string } }): Promise<unknown>;
  deleteMany(args: {
    where: { integrationEventId: string; consumerName: string };
  }): Promise<unknown>;
};

/** Adapts a Prisma model delegate with `(integrationEventId, consumerName)` unique key. */
export function createPrismaInboxStore(delegate: PrismaInboxDelegate): InboxLedgerStore {
  return {
    async tryInsert({ eventId, consumerName }: InboxLedgerKey): Promise<void> {
      await delegate.create({
        data: { integrationEventId: eventId, consumerName },
      });
    },
    async delete({ eventId, consumerName }: InboxLedgerKey): Promise<void> {
      await delegate.deleteMany({
        where: { integrationEventId: eventId, consumerName },
      });
    },
  };
}
