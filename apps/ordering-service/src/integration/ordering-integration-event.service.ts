import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { IEventBus } from '@eshop/event-bus-amqp';
import { IntegrationEvent } from '@eshop/event-bus-amqp';
import { EVENT_BUS } from '@eshop/event-bus-amqp/nest';
import {
  appendToOutbox,
  createServiceOutboxMetricsRegistrar,
  EventState,
  mapIntegrationEventLogRow,
} from '@eshop/outbox';
import type { IntegrationEventLogRow } from '@eshop/outbox';

import type { OrderingTxContext } from './ordering-tx-context';
import { prismaToSqlExecutor } from '../infrastructure/prisma/prisma-sql.executor';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

import { ORDERING_OUTBOX_PENDING_BY_TRANSACTION_SQL } from './ordering-outbox-publish-queries';
import { resolveOrderingIntegrationEmitName } from './resolve-ordering-integration-emit-name';
import { reviveOrderingIntegrationFromLogRow } from './revive-ordering-integration-from-log';

@Injectable()
export class OrderingIntegrationEventService implements OnModuleInit {
  private readonly log = new Logger(OrderingIntegrationEventService.name);

  private readonly outboxMetrics = createServiceOutboxMetricsRegistrar({
    schema: 'ordering',
    meterName: 'eshop.ordering.outbox',
    createExecutor: () => prismaToSqlExecutor(this.prisma),
  });

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  onModuleInit(): void {
    this.outboxMetrics.onModuleInit();
  }

  /**
   * Transactional domain work writes one or more outbox rows (same Postgres transaction + `transactionId`).
   * After commit, publishes rows **FIFO by `"CreationTime" ASC`** (see `ORDERING_OUTBOX_PENDING_BY_TRANSACTION_SQL`);
   * match reference `OrderingIntegrationEventService.PublishEventsThroughEventBusAsync` ordering for a transaction.
   */
  async withOrderingOutbox<T>(work: (ctx: OrderingTxContext) => Promise<T>): Promise<T> {
    const transactionId = randomUUID();
    const result = await this.prisma.$transaction(async (tx) => {
      const enqueue = async (evt: IntegrationEvent) => {
        await appendToOutbox(prismaToSqlExecutor(tx), transactionId, evt, {
          schema: 'ordering',
          resolveEventTypeName: resolveOrderingIntegrationEmitName,
        });
      };
      return work({ prismaTx: tx, enqueueIntegrationEvent: enqueue, transactionId });
    });

    await this.publishPendingForTransaction(transactionId);
    return result;
  }

  async publishThroughEventBusAsync(evt: IntegrationEvent): Promise<void> {
    try {
      await this.markInProgress(evt.Id);
      await this.bus.publish(evt);
      await this.markPublished(evt.Id);
    } catch (err) {
      this.log.error(err, `Publishing failed for integration event ${evt.Id} (${evt.constructor.name})`);

      await this.markPublishFailed(evt.Id);
      throw err;
    }
  }

  private async publishPendingForTransaction(transactionId: string): Promise<void> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      ORDERING_OUTBOX_PENDING_BY_TRANSACTION_SQL,
      transactionId,
      EventState.NotPublished,
    );

    for (const raw of rows) {
      const row = mapIntegrationEventLogRow(raw);
      await this.publishOneLogged(row);
    }
  }

  private async publishOneLogged(row: IntegrationEventLogRow): Promise<void> {
    try {
      const evt = reviveOrderingIntegrationFromLogRow(row);
      await this.publishThroughEventBusAsync(evt);
    } catch (err) {
      this.log.error(err, `Failed revive/publish ordering outbox row ${row.eventId}`);
      await this.markPublishFailed(row.eventId);
    }
  }

  private async markInProgress(eventId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE ordering."IntegrationEventLog"
       SET "State" = $1::integer,
           "TimesSent" = "TimesSent" + 1
       WHERE "EventId" = $2::uuid`,
      EventState.InProgress,
      eventId,
    );
  }

  private async markPublished(eventId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE ordering."IntegrationEventLog" SET "State" = $1::integer WHERE "EventId" = $2::uuid`,
      EventState.Published,
      eventId,
    );
    this.outboxMetrics.counters.published?.add(1);
  }

  private async markPublishFailed(eventId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE ordering."IntegrationEventLog" SET "State" = $1::integer WHERE "EventId" = $2::uuid`,
      EventState.PublishedFailed,
      eventId,
    );
    this.outboxMetrics.counters.publishFailed?.add(1);
  }
}
