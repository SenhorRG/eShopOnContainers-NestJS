import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { assignOtelServiceName } from './assign-service-name-env';
import { applyCorrelationIdMiddleware } from './apply-correlation-id.middleware';
import { applyEshopHttpCors } from './apply-eshop-http-cors';
import { bootstrapObservability, shutdownObservability } from './bootstrap-observability';
import { useNestPinoLogger } from './nest-pino.wire';
import { resolveRootModule, type RootModuleLoader } from './resolve-root-module';

export interface BootstrapEshopNestWorkerOptions {
  serviceName: string;
  defaultPort: number;
  onApplicationReady?: (app: INestApplication) => Promise<void> | void;
}

export async function bootstrapEshopNestWorker(
  rootModule: RootModuleLoader,
  options: BootstrapEshopNestWorkerOptions,
): Promise<void> {
  const serviceName = assignOtelServiceName(options.serviceName);
  bootstrapObservability({ serviceName });

  const app = await NestFactory.create(await resolveRootModule(rootModule), { bufferLogs: true });
  useNestPinoLogger(app);
  applyEshopHttpCors(app);
  applyCorrelationIdMiddleware(app);

  await app.init();

  if (options.onApplicationReady) {
    await Promise.resolve(options.onApplicationReady(app));
  }

  const port = Number(process.env.PORT ?? options.defaultPort);
  await app.listen(port);

  let closing = false;
  const stop = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    try {
      await app.close();
    } finally {
      await shutdownObservability();
      process.exit(0);
    }
  };
  process.once('SIGTERM', () => void stop());
  process.once('SIGINT', () => void stop());
}
