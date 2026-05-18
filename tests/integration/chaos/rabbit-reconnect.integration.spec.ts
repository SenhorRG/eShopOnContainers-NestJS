import amqp from 'amqplib';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { describeIfDocker } from '../helpers/docker';
import { startInfraStack, stopInfraStack, type InfraStack } from '../setup/testcontainers.setup';

describeIfDocker('chaos — RabbitMQ reconnect', () => {
  let stack: InfraStack;

  beforeAll(async () => {
    stack = await startInfraStack();
  }, 180_000);

  afterAll(async () => {
    if (stack) await stopInfraStack(stack);
  });

  it('reconnects after closing the first connection', async () => {
    const first = await amqp.connect(stack.rabbitUri);
    await first.close();

    const second = await amqp.connect(stack.rabbitUri);
    const ch = await second.createChannel();
    await ch.assertExchange('eshop_event_bus', 'direct', { durable: true });
    await ch.close();
    await second.close();
    expect(true).toBe(true);
  });
});
