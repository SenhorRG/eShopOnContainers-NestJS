import path from 'node:path';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import type { ClientUnaryCall, ServiceError } from '@grpc/grpc-js';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import jwt from 'jsonwebtoken';
import { ConfigModule } from '@nestjs/config';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { Module, type INestApplication } from '@nestjs/common';

import { describeIfDocker } from './describe-if-docker';
import { BASKET_REPOSITORY } from '../src/application/basket/basket.tokens';
import { RedisBasketRepository } from '../src/infrastructure/redis-basket.repository';
import { RedisModule } from '../src/infrastructure/redis.module';
import { BasketGrpcController } from '../src/api/grpc/basket.grpc.controller';
import { BasketGrpcIdentityService } from '../src/api/grpc/basket-grpc-identity.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
  ],
  controllers: [BasketGrpcController],
  providers: [
    BasketGrpcIdentityService,
    RedisBasketRepository,
    { provide: BASKET_REPOSITORY, useExisting: RedisBasketRepository },
  ],
})
class BasketGrpcItModule {}

type BasketClient = {
  GetBasket(
    request: object,
    md: grpc.Metadata,
    cb: (err: ServiceError | null, res: { items?: Array<{ product_id?: number; quantity?: number }> }) => void,
  ): ClientUnaryCall;
  UpdateBasket(
    request: { items: Array<{ product_id?: number; quantity?: number }> },
    md: grpc.Metadata,
    cb: (err: ServiceError | null, res: { items?: unknown[] }) => void,
  ): ClientUnaryCall;
};

function loadStub(port: number): BasketClient {
  const protoPath = path.join(__dirname, '..', '..', '..', 'contracts', 'grpc', 'basket.proto');

  const defs = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const pkg = grpc.loadPackageDefinition(defs) as { BasketApi: { Basket: new (a: string, b: grpc.ChannelCredentials) => BasketClient } };

  return new pkg.BasketApi.Basket(`127.0.0.1:${port}`, grpc.credentials.createInsecure());
}

describeIfDocker('Basket gRPC (loopback stub)', () => {
  let redisBox: StartedTestContainer | undefined;
  let app: INestApplication | undefined;
  const grpcPort = 21000 + (process.pid % 3900);

  beforeAll(async () => {
    process.env.ESHOP_BASKET_JWT_SECRET = 'basket-grpc-test-secret';
    redisBox = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
    process.env.ESHOP_REDIS_URL = `redis://${redisBox.getHost()}:${redisBox.getMappedPort(6379)}`;

    app = await NestFactory.create(BasketGrpcItModule, { logger: false });

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'BasketApi',
        protoPath: path.join(__dirname, '..', '..', '..', 'contracts', 'grpc', 'basket.proto'),
        url: `0.0.0.0:${grpcPort}`,
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      },
    });

    await app.startAllMicroservices();
    await app.init();
  });

  afterAll(async () => {
    await app?.close().catch(() => undefined);
    await redisBox?.stop().catch(() => undefined);
  });

  test('UpdateBasket + GetBasket honours bearer sub and snake_case items', async () => {
    const client = loadStub(grpcPort);
    const token = jwt.sign({ sub: 'grpc-user-1' }, 'basket-grpc-test-secret');
    const md = new grpc.Metadata();
    md.add('authorization', `Bearer ${token}`);

    await new Promise<void>((resolve, reject) => {
      client.UpdateBasket({ items: [{ product_id: 3, quantity: 2 }] }, md, (err, res) => {
        if (err) return reject(err);
        expect(res.items).toHaveLength(1);
        expect(res.items?.[0]?.product_id).toBe(3);
        expect(res.items?.[0]?.quantity).toBe(2);
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      client.GetBasket({}, md, (err, res) => {
        if (err) return reject(err);
        expect(res.items).toHaveLength(1);
        expect(res.items?.[0]?.quantity).toBe(2);
        resolve();
      });
    });
  });

  test('GetBasket without bearer returns empty payload when anonymous access is enabled', async () => {
    const client = loadStub(grpcPort);
    await new Promise<void>((resolve, reject) => {
      client.GetBasket({}, new grpc.Metadata(), (err, res) => {
        if (err) return reject(err);
        expect(res.items ?? []).toEqual([]);
        resolve();
      });
    });
  });
});
