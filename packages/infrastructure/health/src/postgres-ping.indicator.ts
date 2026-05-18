import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import { Client } from 'pg';

@Injectable()
export class PostgresPingIndicator extends HealthIndicator {
  async ping(key: string, connectionString: string, redact: boolean): Promise<HealthIndicatorResult> {
    const client = new Client({ connectionString, connectionTimeoutMillis: 2000 });
    try {
      await client.connect();
      await client.query('SELECT 1');
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
      await client.end().catch(() => undefined);
    }
  }
}
