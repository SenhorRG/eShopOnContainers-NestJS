import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { HEALTH_OPTIONS, type HealthModuleRegisterOptions } from './health.types';
import { PostgresPingIndicator } from './postgres-ping.indicator';
import { RabbitMqPingIndicator } from './rabbitmq-ping.indicator';
import { RedisPingIndicator } from './redis-ping.indicator';

@Controller()
export class HealthProbeController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly pg: PostgresPingIndicator,
    private readonly redis: RedisPingIndicator,
    private readonly rabbit: RabbitMqPingIndicator,
    @Inject(HEALTH_OPTIONS) private readonly opts: HealthModuleRegisterOptions,
  ) {}

  @Get('alive')
  liveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health')
  @HealthCheck()
  readiness() {
    const redact =
      this.opts.sensitiveEnvironment === true ||
      String(process.env.NODE_ENV).toLowerCase() === 'production';

    const checks: Array<() => ReturnType<PostgresPingIndicator['ping']>> = [];

    if (this.opts.postgresUrl) {
      checks.push(() => this.pg.ping('postgres', this.opts.postgresUrl!, redact));
    }
    if (this.opts.redisUrl) {
      checks.push(() => this.redis.ping('redis', this.opts.redisUrl!, redact));
    }
    if (this.opts.rabbitUri) {
      checks.push(() => this.rabbit.ping('rabbitmq', this.opts.rabbitUri!, redact));
    }

    if (checks.length === 0) {
      return this.health.check([
        async () => ({ process: { status: 'up' as const, message: 'no remote probes configured' } }),
      ]);
    }

    return this.health.check(checks);
  }
}
