import { randomUUID } from 'node:crypto';

import type { IntegrationJson } from '@eshop/event-bus-amqp';
import {
  RabbitMqEventBus,
  RabbitMqTelemetry,
  SubscriptionRegistry,
  defaultEventBusOptions,
  type IIntegrationEventHandler,
} from '@eshop/event-bus-amqp';
import { OrderStartedIntegrationEvent } from '@eshop/integration-event-types';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { RedisBasketRepository } from '../src/infrastructure/redis-basket.repository';
import { describeIfDocker } from './describe-if-docker';

function hostConnection(host: string, port: number) {
  return { hostname: host, port, username: 'guest', password: 'guest', vhost: '/' as const };
}

async function untilTrue(fn: () => Promise<boolean>, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 40));
  }
  throw new Error('timed out waiting for condition');
}

describeIfDocker('OrderStartedIntegrationEvent consumer (rabbit + redis testcontainers)', () => {
  let redisC: StartedTestContainer | undefined;

  beforeAll(async () => {
    redisC = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
  });

  afterAll(async () => {
    await redisC?.stop().catch(() => undefined);
  });

  describe('clears persisted basket via fan-out exchange', () => {
    let rabbitC: StartedTestContainer | undefined;

    beforeAll(async () => {
      rabbitC = await new GenericContainer('rabbitmq:3.13-management-alpine')
        .withExposedPorts(5672)
        .withEnvironment({
          RABBITMQ_DEFAULT_USER: 'guest',
          RABBITMQ_DEFAULT_PASS: 'guest',
        })
        .start();
    });

    afterAll(async () => {
      await rabbitC?.stop().catch(() => undefined);
    });

    test('publish OrderStarted clears /basket/{UserId}', async () => {
      const rabbitConn = hostConnection(rabbitC!.getHost(), rabbitC!.getMappedPort(5672));
      const redisUrl = `redis://${redisC!.getHost()}:${redisC!.getMappedPort(6379)}`;
      const redis = new Redis(redisUrl);
      const sut = new RedisBasketRepository(redis);

      await sut.updateBasketAsync({
        BuyerId: 'user-order-started-it',
        Items: [{ ProductId: 5, Quantity: 1 }],
      });

      expect((await sut.getBasketAsync('user-order-started-it'))?.Items.length).toBe(1);

      const telemetry = new RabbitMqTelemetry();

      const publisher = new RabbitMqEventBus(
        defaultEventBusOptions({
          subscriptionClientName: `basket-it-publisher-${randomUUID().slice(0, 8)}`,
          connection: rabbitConn,
        }),
        new SubscriptionRegistry(),
        telemetry,
        {},
      );

      const subscriberRegistry = new SubscriptionRegistry();
      const handler: IIntegrationEventHandler<OrderStartedIntegrationEvent> = {
        handle: async (evt) => {
          await sut.deleteBasketAsync(evt.UserId);
        },
      };

      subscriberRegistry.register(OrderStartedIntegrationEvent.name, (j: IntegrationJson) =>
        OrderStartedIntegrationEvent.revive(j as Record<string, unknown>),
        handler,
      );

      const consumer = new RabbitMqEventBus(
        defaultEventBusOptions({
          subscriptionClientName: `basket-consumer-${randomUUID().slice(0, 8)}`,
          connection: rabbitConn,
          consumerAckPolicy: 'afterHandlerSuccess',
        }),
        subscriberRegistry,
        telemetry,
        {},
      );

      await publisher.start();
      await consumer.start();

      await publisher.publish(new OrderStartedIntegrationEvent('user-order-started-it'));

      await untilTrue(async () => (await sut.getBasketAsync('user-order-started-it')) === null);

      await consumer.stop();
      await publisher.stop();

      await redis.quit().catch(() => undefined);
    });
  });

  describe('double delivery tolerated (idempotent delete)', () => {
    let rabbitC: StartedTestContainer | undefined;

    beforeAll(async () => {
      rabbitC = await new GenericContainer('rabbitmq:3.13-management-alpine')
        .withExposedPorts(5672)
        .withEnvironment({
          RABBITMQ_DEFAULT_USER: 'guest',
          RABBITMQ_DEFAULT_PASS: 'guest',
        })
        .start();
    });

    afterAll(async () => {
      await rabbitC?.stop().catch(() => undefined);
    });

    test('two publishes with identical payload keep basket absent', async () => {
      const rabbitConn = hostConnection(rabbitC!.getHost(), rabbitC!.getMappedPort(5672));
      const redisUrl = `redis://${redisC!.getHost()}:${redisC!.getMappedPort(6379)}`;
      const redis = new Redis(redisUrl);
      const sut = new RedisBasketRepository(redis);

      await sut.updateBasketAsync({ BuyerId: 'idem-user', Items: [{ ProductId: 1, Quantity: 1 }] });

      const telemetry = new RabbitMqTelemetry();
      const correlationId = randomUUID();

      const publisher = new RabbitMqEventBus(
        defaultEventBusOptions({
          subscriptionClientName: `basket-it-publisher-idem-${randomUUID().slice(0, 8)}`,
          connection: rabbitConn,
        }),
        new SubscriptionRegistry(),
        telemetry,
        {},
      );

      const subscriberRegistry = new SubscriptionRegistry();
      subscriberRegistry.register(OrderStartedIntegrationEvent.name, (j: IntegrationJson) =>
        OrderStartedIntegrationEvent.revive(j as Record<string, unknown>),
        {
          handle: async (evt) => sut.deleteBasketAsync(evt.UserId),
        },
      );

      const consumer = new RabbitMqEventBus(
        defaultEventBusOptions({
          subscriptionClientName: `basket-consumer-idem-${randomUUID().slice(0, 8)}`,
          connection: rabbitConn,
          consumerAckPolicy: 'afterHandlerSuccess',
        }),
        subscriberRegistry,
        telemetry,
        {},
      );

      await publisher.start();
      await consumer.start();

      const envelope = new OrderStartedIntegrationEvent('idem-user', correlationId);
      await publisher.publish(envelope);
      await publisher.publish(envelope);

      await untilTrue(async () => (await sut.getBasketAsync('idem-user')) === null);

      await consumer.stop();
      await publisher.stop();

      await redis.quit().catch(() => undefined);
    });
  });
});
