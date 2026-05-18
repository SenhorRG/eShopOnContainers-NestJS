import Redis from 'ioredis';
import { Client } from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';

import {
  adaptIoredisInboxClient,
  createPrismaInboxStore,
  createRedisInboxStore,
  releaseInbox,
  tryAcquireInbox,
} from '@eshop/inbox';

import { describeIfDocker } from '../helpers/docker';
import { startInfraStack, stopInfraStack, type InfraStack } from '../setup/testcontainers.setup';

function prismaUniqueViolation(err: unknown): Error {
  const wrapped = new Error('Unique constraint', { cause: err });
  (wrapped as { code: string }).code = 'P2002';
  return wrapped;
}

describeIfDocker('inbox dedup (Testcontainers)', () => {
  let stack: InfraStack;

  beforeAll(async () => {
    stack = await startInfraStack();
  }, 180_000);

  afterAll(async () => {
    if (stack) await stopInfraStack(stack);
  });

  it('Redis SET NX rejects duplicate (eventId, consumer)', async () => {
    const redis = new Redis(stack.redisUrl);
    try {
      const store = createRedisInboxStore(adaptIoredisInboxClient(redis), {
        keyPrefix: 'it:inbox:',
        ttlSeconds: 300,
      });
      const key = {
        eventId: '11111111-1111-4111-8111-111111111111',
        consumerName: 'basket:OrderStarted',
      };
      expect(await tryAcquireInbox(store, key)).toBe(true);
      expect(await tryAcquireInbox(store, key)).toBe(false);
      await releaseInbox(store, key);
      expect(await tryAcquireInbox(store, key)).toBe(true);
    } finally {
      await redis.quit();
    }
  });

  it('Prisma-style unique row rejects duplicate delivery', async () => {
    const client = new Client({ connectionString: stack.pgConnectionString });
    await client.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS processed_integration_events (
          integration_event_id UUID NOT NULL,
          consumer_name VARCHAR(200) NOT NULL,
          processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (integration_event_id, consumer_name)
        );
      `);

      const delegate = {
        create: async (args: {
          data: { integrationEventId: string; consumerName: string };
        }) => {
          try {
            await client.query(
              `INSERT INTO processed_integration_events (integration_event_id, consumer_name)
               VALUES ($1::uuid, $2)`,
              [args.data.integrationEventId, args.data.consumerName],
            );
          } catch (err: unknown) {
            const code =
              typeof err === 'object' && err !== null && 'code' in err
                ? String((err as { code: string }).code)
                : '';
            if (code === '23505') {
              throw prismaUniqueViolation(err);
            }
            throw err;
          }
        },
        deleteMany: async (args: {
          where: { integrationEventId: string; consumerName: string };
        }) => {
          await client.query(
            `DELETE FROM processed_integration_events
             WHERE integration_event_id = $1::uuid AND consumer_name = $2`,
            [args.where.integrationEventId, args.where.consumerName],
          );
        },
      };

      const store = createPrismaInboxStore(delegate);
      const key = {
        eventId: '22222222-2222-4222-8222-222222222222',
        consumerName: 'ordering:OrderPaymentSucceeded',
      };
      expect(await tryAcquireInbox(store, key)).toBe(true);
      expect(await tryAcquireInbox(store, key)).toBe(false);
      await releaseInbox(store, key);
      expect(await tryAcquireInbox(store, key)).toBe(true);
    } finally {
      await client.end();
    }
  });

  it('duplicate delivery runs handler side-effect once', async () => {
    const client = new Client({ connectionString: stack.pgConnectionString });
    await client.connect();
    try {
      const delegate = {
        create: async (args: {
          data: { integrationEventId: string; consumerName: string };
        }) => {
          try {
            await client.query(
              `INSERT INTO processed_integration_events (integration_event_id, consumer_name)
               VALUES ($1::uuid, $2)`,
              [args.data.integrationEventId, args.data.consumerName],
            );
          } catch (err: unknown) {
            const code =
              typeof err === 'object' && err !== null && 'code' in err
                ? String((err as { code: string }).code)
                : '';
            if (code === '23505') {
              throw prismaUniqueViolation(err);
            }
            throw err;
          }
        },
        deleteMany: async (args: {
          where: { integrationEventId: string; consumerName: string };
        }) => {
          await client.query(
            `DELETE FROM processed_integration_events
             WHERE integration_event_id = $1::uuid AND consumer_name = $2`,
            [args.where.integrationEventId, args.where.consumerName],
          );
        },
      };

      const store = createPrismaInboxStore(delegate);
      const key = {
        eventId: '33333333-3333-4333-8333-333333333333',
        consumerName: 'integration:inbox-dedup',
      };
      let sideEffects = 0;
      const runHandler = async () => {
        if (!(await tryAcquireInbox(store, key))) return;
        sideEffects += 1;
      };

      await runHandler();
      await runHandler();
      await runHandler();
      expect(sideEffects).toBe(1);
    } finally {
      await client.end();
    }
  });
});
