import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '../application/basket/basket.tokens';

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:56379';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = process.env.ESHOP_REDIS_URL ?? DEFAULT_REDIS_URL;
        return new Redis(url, { maxRetriesPerRequest: null });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
