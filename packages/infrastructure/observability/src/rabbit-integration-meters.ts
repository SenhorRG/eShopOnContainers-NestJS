import { metrics } from '@opentelemetry/api';

export function createRabbitIntegrationMeters(meterName = 'eshop.eventbus.rabbit') {
  const meter = metrics.getMeter(meterName);
  return {
    publishDurationMs: meter.createHistogram('eshop_eventbus_publish_duration_ms', {
      unit: 'ms',
      description: 'Client-side time to publish an integration event buffer',
    }),
    consumeProcessDurationMs: meter.createHistogram('eshop_eventbus_consume_process_duration_ms', {
      unit: 'ms',
      description: 'Time spent in application handlers after a message is received',
    }),
  };
}
