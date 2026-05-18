import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { IEventBus } from '@eshop/event-bus-amqp';
import { IntegrationEvent } from '@eshop/event-bus-amqp';
import { EVENT_BUS } from '@eshop/event-bus-amqp/nest';
import type { Prisma } from '@catalog/prisma-client';

import {
  CatalogEmitEventFullNames,
  OrderStockConfirmedIntegrationEvent,
  OrderStockRejectedIntegrationEvent,
  ProductPriceChangedIntegrationEvent,
} from '@eshop/integration-event-types';
import { appendToOutbox, createServiceOutboxMetricsRegistrar, EventState } from '@eshop/outbox';

import { prismaToSqlExecutor } from '../infrastructure/prisma/prisma-sql.executor';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

function resolveIntegrationEventDotnetFullName(event: IntegrationEvent): string {
  switch (event.constructor.name) {
    case ProductPriceChangedIntegrationEvent.name:
      return CatalogEmitEventFullNames.ProductPriceChanged;
    case OrderStockConfirmedIntegrationEvent.name:
      return CatalogEmitEventFullNames.OrderStockConfirmed;
    case OrderStockRejectedIntegrationEvent.name:
      return CatalogEmitEventFullNames.OrderStockRejected;
    default:
      return event.constructor.name;
  }
}

@Injectable()
export class CatalogIntegrationEventService implements OnModuleInit {
  private readonly log = new Logger(CatalogIntegrationEventService.name);

  private readonly outboxMetrics = createServiceOutboxMetricsRegistrar({
    schema: null,
    meterName: 'eshop.catalog.outbox',
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
   * Runs Prisma transactional work plus zero-or-more durable outbox rows sharing the same
   * `TransactionId`, matching EF `IntegrationEventLogService.SaveEventAsync(transaction)`.
   */
  async withCatalogAndOutbox<T>(
    work: (
      tx: Prisma.TransactionClient,
      enqueueIntegrationEvent: (evt: IntegrationEvent) => Promise<void>,
    ) => Promise<T>,
  ): Promise<T> {
    const groupId = randomUUID();
    return this.prisma.$transaction(async (tx) => {
      const enqueue = async (evt: IntegrationEvent) => {
        await appendToOutbox(prismaToSqlExecutor(tx), groupId, evt, {
          schema: null,
          resolveEventTypeName: resolveIntegrationEventDotnetFullName,
        });
      };
      return work(tx, enqueue);
    });
  }

  async publishThroughEventBusAsync(evt: IntegrationEvent): Promise<void> {
    try {
      this.log.log(`Publishing integration event ${evt.Id} (${evt.constructor.name})`);

      await this.markInProgress(evt.Id);
      await this.bus.publish(evt);
      await this.markPublished(evt.Id);
    } catch (err) {
      this.log.error(
        err,
        `Publishing failed for integration event ${evt.Id} (${evt.constructor.name})`,
      );
      await this.markPublishFailed(evt.Id);
      throw err;
    }
  }

  private async markInProgress(eventId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE public."IntegrationEventLog"
       SET "State" = $1::integer,
           "TimesSent" = "TimesSent" + 1
       WHERE "EventId" = $2::uuid`,
      EventState.InProgress,
      eventId,
    );
  }

  private async markPublished(eventId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE public."IntegrationEventLog" SET "State" = $1::integer WHERE "EventId" = $2::uuid`,
      EventState.Published,
      eventId,
    );
    this.outboxMetrics.counters.published?.add(1);
  }

  private async markPublishFailed(eventId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE public."IntegrationEventLog" SET "State" = $1::integer WHERE "EventId" = $2::uuid`,
      EventState.PublishedFailed,
      eventId,
    );
    this.outboxMetrics.counters.publishFailed?.add(1);
  }
}
