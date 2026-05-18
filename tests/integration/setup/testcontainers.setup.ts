import type { StartedTestContainer } from 'testcontainers';
import { GenericContainer, Wait } from 'testcontainers';

export type InfraStack = {
  postgres: StartedTestContainer;
  redis: StartedTestContainer;
  rabbit: StartedTestContainer;
  pgConnectionString: string;
  redisUrl: string;
  rabbitUri: string;
};

export async function startInfraStack(): Promise<InfraStack> {
  const [postgres, redis, rabbit] = await Promise.all([
    new GenericContainer('pgvector/pgvector:pg16')
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'itest',
      })
      .withExposedPorts(5432)
      .withStartupTimeout(180_000)
      .withWaitStrategy(Wait.forListeningPorts())
      .start(),
    new GenericContainer('redis:7-alpine').withExposedPorts(6379).withStartupTimeout(120_000).start(),
    new GenericContainer('rabbitmq:3-management-alpine')
      .withEnvironment({
        RABBITMQ_DEFAULT_USER: 'guest',
        RABBITMQ_DEFAULT_PASS: 'guest',
      })
      .withExposedPorts(5672)
      .withStartupTimeout(180_000)
      .withWaitStrategy(Wait.forListeningPorts())
      .start(),
  ]);

  const pgHost = postgres.getHost();
  const pgPort = postgres.getMappedPort(5432);
  const pgConnectionString = `postgresql://postgres:postgres@${pgHost}:${String(pgPort)}/itest`;

  const redisUrl = `redis://${redis.getHost()}:${String(redis.getMappedPort(6379))}`;
  const rabbitUri = `amqp://guest:guest@${rabbit.getHost()}:${String(rabbit.getMappedPort(5672))}/`;

  return { postgres, redis, rabbit, pgConnectionString, redisUrl, rabbitUri };
}

export async function stopInfraStack(stack: InfraStack): Promise<void> {
  await Promise.all([
    stack.postgres.stop().catch(() => undefined),
    stack.redis.stop().catch(() => undefined),
    stack.rabbit.stop().catch(() => undefined),
  ]);
}
