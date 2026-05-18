import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { Pool } from 'pg';

import type { IEventBus } from '@eshop/event-bus-amqp';
import { EVENT_BUS } from '@eshop/event-bus-amqp/nest';
import { GracePeriodConfirmedIntegrationEvent } from '@eshop/integration-event-types';

/** Advisory lock key — single leader among horizontally scaled replicas (best-effort dedup). */
const GRACE_PERIOD_ADVISORY_LOCK_KEY = 902_105_501;

/**
 * Grace period scanner: publishes `GracePeriodConfirmedIntegrationEvent` when orders exceed the window.
 *
 * Env:
 * - `ESHOP_BACKGROUND_TASK_GRACE_PERIOD_MINUTES` — grace window (default `1`)
 * - `ESHOP_BACKGROUND_TASK_CHECK_UPDATE_SECONDS` — poll interval (default `30`)
 *
 * Legacy: `ESHOP_GRACE_PERIOD_MINUTES`, `ESHOP_GRACE_POLL_INTERVAL_MS` (converted to seconds).
 */
@Injectable()
export class GracePeriodManagerService implements OnModuleDestroy {
  private readonly log = new Logger(GracePeriodManagerService.name);

  private pool?: Pool;

  private loopTimer?: ReturnType<typeof setTimeout>;

  private destroyed = false;

  constructor(@Inject(EVENT_BUS) private readonly bus: IEventBus) {}

  onModuleDestroy(): void {
    this.destroyed = true;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    void this.pool?.end().catch(() => undefined);
  }

  /** Invoke after AMQP wiring (`main.ts` calls after `app.init()`). */
  beginAfterBusReady(): void {
    const url = process.env.ESHOP_ORDERING_DATABASE_URL;
    if (!url) {
      this.log.warn('ESHOP_ORDERING_DATABASE_URL missing — grace-period manager disabled');
      return;
    }

    const graceMinutes = this.resolveGracePeriodMinutes();
    const checkUpdateSeconds = this.resolveCheckUpdateSeconds();

    this.pool = new Pool({
      connectionString: url,
      max: Number(process.env.ESHOP_ORDERING_PG_POOL ?? 5),
      idleTimeoutMillis: 10000,
    });

    this.log.log(
      `GracePeriodManagerService active (GracePeriodTime=${String(graceMinutes)}m CheckUpdateTime=${String(checkUpdateSeconds)}s, jitter 5–20%).`,
    );

    void this.runTick(graceMinutes, checkUpdateSeconds);
  }

  private resolveGracePeriodMinutes(): number {
    const primary = Number(process.env.ESHOP_BACKGROUND_TASK_GRACE_PERIOD_MINUTES);
    const legacy = Number(process.env.ESHOP_GRACE_PERIOD_MINUTES);
    const raw = Number.isFinite(primary) && primary > 0 ? primary : legacy;
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  }

  private resolveCheckUpdateSeconds(): number {
    const primary = Number(process.env.ESHOP_BACKGROUND_TASK_CHECK_UPDATE_SECONDS);
    if (Number.isFinite(primary) && primary >= 1) return Math.floor(primary);

    const legacyMs = Number(process.env.ESHOP_GRACE_POLL_INTERVAL_MS);
    if (Number.isFinite(legacyMs) && legacyMs >= 5000) return Math.max(1, Math.round(legacyMs / 1000));

    return 30;
  }

  private scheduleTick(graceMinutes: number, checkUpdateSeconds: number): void {
    if (this.destroyed) return;

    const baseMs = checkUpdateSeconds * 1000;
    const jitterRatio = 0.05 + Math.random() * 0.15;
    const delayMs = Math.floor(baseMs * (1 + jitterRatio));

    this.loopTimer = setTimeout(() => {
      void this.runTick(graceMinutes, checkUpdateSeconds);
    }, delayMs);
  }

  private async runTick(graceMinutes: number, checkUpdateSeconds: number): Promise<void> {
    if (!this.pool || this.destroyed) return;

    try {
      await this.checkConfirmedGracePeriodOrders(graceMinutes);
    } catch (err) {
      this.log.error(err as Error, 'Grace period tick failed — will reschedule');
    } finally {
      this.scheduleTick(graceMinutes, checkUpdateSeconds);
    }
  }

  /**
   * Equivalent SQL to reference `GracePeriodManagerService.GetConfirmedGracePeriodOrders`:
   * `CURRENT_TIMESTAMP - "OrderDate" >= grace interval AND "OrderStatus" = 'Submitted'`.
   */
  private async checkConfirmedGracePeriodOrders(graceMinutes: number): Promise<void> {
    const pool = this.pool;
    if (!pool) return;

    const client = await pool.connect();
    try {
      const locked = await tryAdvisoryLock(client, GRACE_PERIOD_ADVISORY_LOCK_KEY);
      if (!locked) {
        this.log.debug('Another replica holds the grace-period advisory lock — skipping tick');
        return;
      }

      const res = await client.query<{ Id: number }>(
        `
        SELECT "Id"
        FROM ordering.orders
        WHERE "OrderStatus" = $1
          AND CURRENT_TIMESTAMP - "OrderDate" >= ($2::double precision * INTERVAL '1 minute')
      `,
        ['Submitted', graceMinutes],
      );

      for (const row of res.rows) {
        const evt = new GracePeriodConfirmedIntegrationEvent(row.Id);
        this.log.log(
          `Publishing integration event ${evt.Id}: GracePeriodConfirmedIntegrationEvent (order=${String(row.Id)})`,
        );
        await this.bus.publish(evt);
      }
    } finally {
      await advisoryUnlock(client, GRACE_PERIOD_ADVISORY_LOCK_KEY).catch(() => undefined);
      client.release();
    }
  }
}

async function tryAdvisoryLock(client: PoolClient, key: number): Promise<boolean> {
  const r = await client.query<{ pg_try_advisory_lock: boolean }>(
    'SELECT pg_try_advisory_lock($1::bigint)',
    [key],
  );
  return r.rows[0]?.pg_try_advisory_lock === true;
}

async function advisoryUnlock(client: PoolClient, key: number): Promise<void> {
  await client.query('SELECT pg_advisory_unlock($1::bigint)', [key]);
}
