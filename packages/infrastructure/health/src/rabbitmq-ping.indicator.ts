import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import { connect as amqpConnect, type ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMqPingIndicator extends HealthIndicator {
  async ping(key: string, uri: string, redact: boolean): Promise<HealthIndicatorResult> {
    let conn: ChannelModel | undefined;
    try {
      conn = await amqpConnect(uri);
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
      await conn?.close().catch(() => undefined);
    }
  }
}
