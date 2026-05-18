import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ProblemDetailsExceptionFilter } from '@eshop/shared-exception-filters';

import { assignOtelServiceName } from './assign-service-name-env';
import { applyCorrelationIdMiddleware } from './apply-correlation-id.middleware';
import { applyEshopHttpCors } from './apply-eshop-http-cors';
import { bootstrapObservability, shutdownObservability } from './bootstrap-observability';
import { useNestPinoLogger } from './nest-pino.wire';
import { resolveRootModule, type RootModuleLoader } from './resolve-root-module';

export type { RootModuleLoader };

export interface BootstrapEshopHttpMicroserviceOptions {
  tracingServiceName: string;
  defaultPort: number;
  /** Extend bootstrap (Swagger, API versioning, global pipes/filters). */
  configureApp?: (app: INestApplication) => Promise<void> | void;
}

export async function bootstrapEshopHttpMicroservice(
  rootModule: RootModuleLoader,
  options: BootstrapEshopHttpMicroserviceOptions,
): Promise<void> {
  const serviceName = assignOtelServiceName(options.tracingServiceName);
  bootstrapObservability({ serviceName });

  const app = await NestFactory.create(await resolveRootModule(rootModule), { bufferLogs: true });
  useNestPinoLogger(app);
  applyEshopHttpCors(app);
  applyCorrelationIdMiddleware(app);

  if (options.configureApp) {
    await Promise.resolve(options.configureApp(app));
  }

  app.useGlobalFilters(new ProblemDetailsExceptionFilter());

  const port = Number(process.env.PORT ?? options.defaultPort);
  await app.listen(port);

  let closing = false;
  const stop = async () => {
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
