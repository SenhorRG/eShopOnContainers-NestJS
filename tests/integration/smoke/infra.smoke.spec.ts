import pg from 'pg';
import Redis from 'ioredis';
import { afterAll, beforeAll, expect, test } from 'vitest';

import { describeIfDocker } from '../helpers/docker';
import { startInfraStack, stopInfraStack, type InfraStack } from '../setup/testcontainers.setup';

describeIfDocker('Testcontainers smoke (Postgres pgvector + Redis + RabbitMQ)', () => {
  let stack: InfraStack;

  beforeAll(async () => {
    stack = await startInfraStack();
  }, 240_000);

  afterAll(async () => {
    if (stack) await stopInfraStack(stack);
  });

  test('Postgres accepts connections and exposes vector extension image', async () => {
    const client = new pg.Client({ connectionString: stack.pgConnectionString });
    await client.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      const q = await client.query<{ extname: string }>(
        `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
      );
      expect(q.rows.length).toBe(1);
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  test('Redis PING', async () => {
    const r = new Redis({
      host: stack.redis.getHost(),
      port: stack.redis.getMappedPort(6379),
      maxRetriesPerRequest: 1,
    });
    try {
      expect(await r.ping()).toBe('PONG');
    } finally {
      r.disconnect();
    }
  });

  test('RabbitMQ broker port reachable (guest)', async () => {
    expect(stack.rabbitUri.startsWith('amqp://')).toBe(true);
    expect(stack.rabbit.getMappedPort(5672)).toBeGreaterThan(0);
  });
});
