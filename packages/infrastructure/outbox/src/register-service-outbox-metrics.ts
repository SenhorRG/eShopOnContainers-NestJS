import { attachIntegrationEventPendingGauge, createOutboxCounters, type OutboxOtelCounters } from './outbox-metrics';
import { qualifyIntegrationEventLogTable } from './qualified-table';
import type { SqlExecutor } from './sql-executor';

export type ServiceOutboxMetricsRegistrarOptions = {
  schema: string | null;
  meterName: string;
  createExecutor: () => SqlExecutor;
};

/** Wires OTEL counters + pending gauge for a service using IntegrationEventLog. */
export function createServiceOutboxMetricsRegistrar(
  options: ServiceOutboxMetricsRegistrarOptions,
): { counters: OutboxOtelCounters; onModuleInit: () => void } {
  const counters = createOutboxCounters(options.meterName);
  const qualifiedTable = qualifyIntegrationEventLogTable(options.schema);

  return {
    counters,
    onModuleInit() {
      attachIntegrationEventPendingGauge({
        meterName: options.meterName,
        qualifiedTable,
        executor: options.createExecutor(),
      });
    },
  };
}
