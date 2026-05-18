import { metrics } from '@opentelemetry/api';

export function createRedisInboxMeters(meterName = 'eshop.inbox.redis') {
  const meter = metrics.getMeter(meterName);
  return {
    acquired: meter.createCounter('eshop_inbox_redis_acquired_total', {
      description: 'Redis inbox keys inserted (handler should run)',
    }),
    duplicate: meter.createCounter('eshop_inbox_redis_duplicate_total', {
      description: 'Duplicate integration deliveries skipped via Redis SET NX',
    }),
    errors: meter.createCounter('eshop_inbox_redis_errors_total', {
      description: 'Unexpected Redis inbox errors (not duplicate-key)',
    }),
  };
}

export type RedisInboxMeters = ReturnType<typeof createRedisInboxMeters>;
