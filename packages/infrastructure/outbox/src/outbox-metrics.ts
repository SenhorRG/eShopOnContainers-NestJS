import { metrics } from '@opentelemetry/api';

import type { SqlExecutor } from './sql-executor';
import { EventState } from './event-state';

export function createOutboxCounters(meterName = 'eshop.outbox') {
  const meter = metrics.getMeter(meterName);
  return {
    published: meter.createCounter('eshop_outbox_events_published_total', {
      description: 'Integration events marked Published in IntegrationEventLog',
    }),
    publishFailed: meter.createCounter('eshop_outbox_events_publish_failed_total', {
      description: 'Integration events marked PublishedFailed after transport errors',
    }),
  };
}

export type OutboxOtelCounters = Partial<ReturnType<typeof createOutboxCounters>>;

export function attachIntegrationEventPendingGauge(options: {
  meterName?: string;
  gaugeName?: string;
  qualifiedTable: string;
  executor: SqlExecutor;
}): void {
  const meter = metrics.getMeter(options.meterName ?? 'eshop.outbox');
  const gaugeName = options.gaugeName ?? 'eshop_outbox_integration_events_pending';
  const pending = meter.createObservableGauge(gaugeName, {
    description: 'Rows still in IntegrationEventLog with State=NotPublished',
  });

  const sql =
    `SELECT COUNT(*)::text AS cnt FROM ${options.qualifiedTable} WHERE "State" = $1`.trim();

  pending.addCallback(async (observableResult) => {
    const r = await options.executor.query<{ cnt: string }>(sql, [EventState.NotPublished]);
    const cnt = Number(r.rows[0]?.cnt ?? 0);
    observableResult.observe(Number.isFinite(cnt) ? cnt : 0);
  });
}
