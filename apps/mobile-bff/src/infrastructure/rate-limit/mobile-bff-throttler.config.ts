import type { ThrottlerModuleOptions } from '@nestjs/throttler';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_LIMIT = 120;

export function mobileBffThrottlerOptionsFromEnv(): ThrottlerModuleOptions {
  const ttl = Number(process.env.ESHOP_BFF_THROTTLE_TTL_MS ?? DEFAULT_TTL_MS);
  const limit = Number(process.env.ESHOP_BFF_THROTTLE_LIMIT ?? DEFAULT_LIMIT);

  return {
    throttlers: [
      {
        ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_MS,
        limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
      },
    ],
  };
}
