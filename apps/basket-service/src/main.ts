import 'reflect-metadata';
import path from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { eshopSwaggerDocumentBuilder, setupEshopSwaggerFromBuilder } from '@eshop/openapi-common';
import {
  applyCorrelationIdMiddleware,
  applyEshopHttpCors,
  assignOtelServiceName,
  bootstrapObservability,
  shutdownObservability,
  useNestPinoLogger,
} from '@eshop/observability';

function resolveBasketProtoPath(): string {
  const fromEnv = process.env.ESHOP_BASKET_PROTO_PATH?.trim();
  if (fromEnv?.length) {
    return path.resolve(fromEnv);
  }
  return path.join(__dirname, '..', '..', '..', 'contracts', 'grpc', 'basket.proto');
}

async function bootstrap(): Promise<void> {
  const serviceName = assignOtelServiceName('basket-service');
  bootstrapObservability({ serviceName });

  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  useNestPinoLogger(app);
  applyEshopHttpCors(app);
  applyCorrelationIdMiddleware(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  setupEshopSwaggerFromBuilder(
    app,
    eshopSwaggerDocumentBuilder('Basket API', 'Redis-backed basket with gRPC and HTTP REST').build(),
  );

  const grpcPort = Number(process.env.GRPC_PORT ?? '9071');

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: 'BasketApi',
        protoPath: resolveBasketProtoPath(),
        url: `0.0.0.0:${grpcPort}`,
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();

  const httpPort = Number(process.env.PORT ?? '5054');
  await app.listen(httpPort);

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

void bootstrap();
