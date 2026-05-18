import { Injectable } from '@nestjs/common';
import type { Prisma } from '@ordering/prisma-client';
import {
  createIdempotencyIfAbsent,
  createPrismaIdempotencyStore,
  idempotencyKeyExists,
} from '@eshop/idempotency';

@Injectable()
export class OrderingRequestManager {
  private storeFor(tx: Prisma.TransactionClient) {
    return createPrismaIdempotencyStore(
      tx.orderingClientRequest as unknown as Parameters<typeof createPrismaIdempotencyStore>[0],
    );
  }

  /** Idempotency check used by PUT/POST flows that mirror `Ordering.Infrastructure.Idempotency.RequestManager`. */
  async exists(prismaTx: Prisma.TransactionClient, id: string): Promise<boolean> {
    return idempotencyKeyExists(this.storeFor(prismaTx), id);
  }

  /** Insert idempotency key before executing the nested business command inside the same transaction. */
  async createIfAbsent(prismaTx: Prisma.TransactionClient, requestId: string, commandClassName: string): Promise<boolean> {
    return createIdempotencyIfAbsent(this.storeFor(prismaTx), requestId, commandClassName);
  }
}
