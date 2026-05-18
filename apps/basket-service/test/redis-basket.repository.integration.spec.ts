import { beforeAll, afterAll, expect, test } from 'vitest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';

import { RedisBasketRepository } from '../src/infrastructure/redis-basket.repository';
import { describeIfDocker } from './describe-if-docker';

describeIfDocker('RedisBasketRepository (testcontainers/redis)', () => {
  let container: StartedTestContainer | undefined;
  let redis: Redis | undefined;
  let sut: RedisBasketRepository | undefined;

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
    const port = container.getMappedPort(6379);
    const host = container.getHost();
    redis = new Redis({ host, port });
    sut = new RedisBasketRepository(redis);
  });

  afterAll(async () => {
    await redis?.quit().catch(() => undefined);
    await container?.stop().catch(() => undefined);
  });

  test('persists and reads PascalCase CustomerBasket payload at /basket/{id}', async () => {
    const dto = {
      BuyerId: 'alice',
      Items: [{ ProductId: 10, Quantity: 2 }],
    };

    await sut!.updateBasketAsync(dto);

    const buf = await redis!.getBuffer(`/basket/${dto.BuyerId}`);

    expect(buf?.toString('utf8')).toContain('"BuyerId"');
    expect(buf?.toString('utf8')).toContain('"Items"');

    const readBack = await sut!.getBasketAsync('alice');
    expect(readBack?.BuyerId).toBe('alice');
    expect(readBack?.Items).toHaveLength(1);
    expect(readBack?.Items[0]?.ProductId).toBe(10);

    await sut!.deleteBasketAsync('alice');

    expect(await sut!.getBasketAsync('alice')).toBeNull();
  });
});
