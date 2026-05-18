import amqp from 'amqplib';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { describeIfDocker } from '../helpers/docker';
import { startInfraStack, stopInfraStack, type InfraStack } from '../setup/testcontainers.setup';

const EXCHANGE = 'eshop_event_bus';

describeIfDocker('saga infra — AMQP publish/consume', () => {
  let stack: InfraStack;
  let conn: amqp.Connection;
  let ch: amqp.Channel;

  beforeAll(async () => {
    stack = await startInfraStack();
    conn = await amqp.connect(stack.rabbitUri);
    ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
  }, 180_000);

  afterAll(async () => {
    if (ch) await ch.close();
    if (conn) await conn.close();
    if (stack) await stopInfraStack(stack);
  });

  it('delivers a test message to a bound queue', async () => {
    const routingKey = 'eshop.integration.test.ping';
    const queue = 'it-saga-ping';
    await ch.assertQueue(queue, { durable: false, autoDelete: true });
    await ch.bindQueue(queue, EXCHANGE, routingKey);

    const body = Buffer.from(JSON.stringify({ eventType: 'TestPing', id: 'it-1' }));
    ch.publish(EXCHANGE, routingKey, body, { contentType: 'application/json', persistent: true });

    const msg = await new Promise<amqp.ConsumeMessage | false>((resolve) => {
      void ch.consume(queue, (m) => resolve(m ?? false), { noAck: true, exclusive: true });
    });
    expect(msg).toBeTruthy();
    if (msg && 'content' in msg) {
      const parsed = JSON.parse(msg.content.toString('utf8')) as { id: string };
      expect(parsed.id).toBe('it-1');
    }
  });
});
