import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';

export const PAYMENT_REDIS_CLIENT = Symbol('PAYMENT_REDIS_CLIENT');

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:56379';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PAYMENT_REDIS_CLIENT,
      useFactory: () => {
        const url = process.env.ESHOP_REDIS_URL ?? DEFAULT_REDIS_URL;
        return new Redis(url, { maxRetriesPerRequest: null });
      },
    },
  ],
  exports: [PAYMENT_REDIS_CLIENT],
})
export class PaymentRedisModule {}
