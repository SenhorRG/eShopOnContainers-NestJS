import type { IntegrationEvent } from '@eshop/event-bus-amqp';
import type { Prisma } from '@ordering/prisma-client';

export type OrderingIntegrationEnqueue = (evt: IntegrationEvent) => Promise<void>;

export type OrderingTxContext = {
  prismaTx: Prisma.TransactionClient;
  enqueueIntegrationEvent: OrderingIntegrationEnqueue;
  transactionId: string;
};
