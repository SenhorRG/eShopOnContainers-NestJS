import type { IntegrationEvent } from '@eshop/event-bus-amqp';

import { EventState } from './event-state';
import { qualifyIntegrationEventLogTable } from './qualified-table';
import type { SqlExecutor } from './sql-executor';

export interface AppendToOutboxConfig {
  /** `ordering` vs `null` (Catalog EF omits explicit schema key on table). */
  schema: string | null;
  /**
   * Use when you still store CLR `FullName`-style identifiers for hybrid migrations.
   * Default: `event.constructor.name` (~ short name consumed by deserialization strategies).
   */
  resolveEventTypeName?: (event: IntegrationEvent) => string;
}

export async function appendToOutbox(
  executor: SqlExecutor,
  transactionId: string,
  event: IntegrationEvent,
  config: AppendToOutboxConfig,
): Promise<void> {
  const table = qualifyIntegrationEventLogTable(config.schema);
  const eventTypeName = config.resolveEventTypeName?.(event) ?? event.constructor.name;

  const sql = `
INSERT INTO ${table} ("EventId", "EventTypeName", "State", "TimesSent", "CreationTime", "Content", "TransactionId")
VALUES ($1::uuid, $2, $3::integer, $4::integer, $5::timestamptz, $6, $7::uuid)
`.trim();

  await executor.query(sql, [
    event.Id,
    eventTypeName,
    EventState.NotPublished,
    0,
    new Date(event.CreationDate),
    JSON.stringify(event, undefined, 2),
    transactionId,
  ]);
}
