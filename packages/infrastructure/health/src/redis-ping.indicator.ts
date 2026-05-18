import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisPingIndicator extends HealthIndicator {
  async ping(key: string, url: string, redact: boolean): Promise<HealthIndicatorResult> {
    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    try {
      await client.connect();
      await client.ping();
      return this.getStatus(key, true);
    } catch (err) {
      const detail = redact
        ? { message: 'unavailable' }
        : { message: String((err as Error).message ?? err) };
      throw new HealthCheckError(
        `${key}_unhealthy`,
        this.getStatus(key, false, detail),
      );
    } finally {
      client.disconnect();
    }
  }
}
