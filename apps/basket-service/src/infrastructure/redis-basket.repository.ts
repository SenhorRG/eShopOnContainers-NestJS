import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';

import type { CustomerBasketDto } from '../application/basket/basket.types';
import { REDIS_CLIENT } from '../application/basket/basket.tokens';
import type { BasketRepositoryPort } from '../application/basket/ports/basket-repository.port';

/**
 * Key prefix `/basket/` matches reference `RedisBasketRepository` Redis UTF-8 key layout.
 * Optional TTL: set `ESHOP_BASKET_REDIS_TTL_SECONDS` (>0) on SET; `0` means no expiry (lab default).
 * Inbox keys use `@eshop/inbox` Redis store with a 14-day TTL (separate prefix).
 */

@Injectable()
export class RedisBasketRepository implements BasketRepositoryPort {
  private readonly log = new Logger(RedisBasketRepository.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private basketKey(customerId: string): string {
    return `/basket/${customerId}`;
  }

  private ttlSeconds(): number {
    const raw = Number(process.env.ESHOP_BASKET_REDIS_TTL_SECONDS ?? 0);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  async deleteBasketAsync(id: string): Promise<boolean> {
    const deleted = await this.redis.del(this.basketKey(id));
    return deleted > 0;
  }

  async getBasketAsync(customerId: string): Promise<CustomerBasketDto | null> {
    const raw = await this.redis.getBuffer(this.basketKey(customerId));
    if (raw === null || raw.length === 0) {
      return null;
    }
    try {
      return JSON.parse(raw.toString('utf8')) as CustomerBasketDto;
    } catch {
      return null;
    }
  }

  async updateBasketAsync(basket: CustomerBasketDto): Promise<CustomerBasketDto | null> {
    const payload = Buffer.from(JSON.stringify(basket), 'utf8');
    const key = this.basketKey(basket.BuyerId);
    const ttl = this.ttlSeconds();
    const ok =
      ttl > 0
        ? ((await this.redis.set(key, payload, 'EX', ttl)) as string | null) === 'OK'
        : ((await this.redis.set(key, payload)) as string | null) === 'OK';

    if (!ok) {
      this.log.warn('Problem occurred persisting the basket item.');
      return null;
    }

    this.log.log('Basket item persisted successfully.');
    return this.getBasketAsync(basket.BuyerId);
  }
}
