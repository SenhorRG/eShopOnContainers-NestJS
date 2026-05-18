import type { INestApplication } from '@nestjs/common';

export function applyExpressTrustProxy(app: INestApplication, hops: number): void {
  const instance = app.getHttpAdapter()?.getInstance?.();
  const setTrust = (
    typeof instance?.set === 'function' ? instance.set.bind(instance) : undefined
  ) as ((key: string, val: unknown) => void) | undefined;
  if (setTrust) {
    setTrust('trust proxy', hops);
  }
}

export function getExpressInstance(app: INestApplication): {
  use: (mount: string, handler: unknown) => void;
} | undefined {
  const httpAdapter = app.getHttpAdapter?.();
  const instance =
    typeof httpAdapter?.getInstance === 'function' ? httpAdapter.getInstance() : undefined;
  if (!instance?.use || typeof instance.use !== 'function') return undefined;
  return instance as { use: (mount: string, handler: unknown) => void };
}
