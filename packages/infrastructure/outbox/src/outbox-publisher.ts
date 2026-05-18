import type { IntegrationEvent } from '@eshop/event-bus-amqp';

import { EventState } from './event-state';
import { mapIntegrationEventLogRow, type IntegrationEventLogRow } from './integration-event-log-row';
import {
  integrationEventClaimAndMarkInProgressSql,
  integrationEventUpdateStateSql,
} from './outbox-sql-templates';
import type { OutboxOtelCounters } from './outbox-metrics';
import { qualifyIntegrationEventLogTable } from './qualified-table';
import type { SqlExecutor } from './sql-executor';

export interface OutboxPublisherOptions {
  executor: SqlExecutor;
  schema: string | null;
  revive: (row: IntegrationEventLogRow) => IntegrationEvent | Promise<IntegrationEvent>;
  publish: (event: IntegrationEvent) => Promise<void>;
  pollIntervalMs?: number;
  metrics?: OutboxOtelCounters;
}

export class OutboxPublisher {
  private readonly qualifiedTable: string;

  private readonly claimSql: string;

  private readonly updateSql: string;

  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly options: OutboxPublisherOptions) {
    this.qualifiedTable = qualifyIntegrationEventLogTable(options.schema);
    this.claimSql = integrationEventClaimAndMarkInProgressSql(this.qualifiedTable);
    this.updateSql = integrationEventUpdateStateSql(this.qualifiedTable);
  }

  start(): void {
    if (this.timer) return;
    const ms = this.options.pollIntervalMs ?? 750;
    this.timer = setInterval(() => void this.tickOnce(), ms);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async tickOnce(): Promise<void> {
    const claimed = await this.options.executor.query<Record<string, unknown>>(this.claimSql, [
      EventState.NotPublished,
      EventState.InProgress,
    ]);

    const raw = claimed.rows[0];
    if (!raw) return;

    const row = mapIntegrationEventLogRow(raw);

    try {
      const envelope = await this.options.revive(row);
      await this.options.publish(envelope);
      await this.options.executor.query(this.updateSql, [row.eventId, EventState.Published]);
      this.options.metrics?.published?.add(1);
    } catch {
      await this.options.executor.query(this.updateSql, [row.eventId, EventState.PublishedFailed]);
      this.options.metrics?.publishFailed?.add(1);
    }
  }
}
