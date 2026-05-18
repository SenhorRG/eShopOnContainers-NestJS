import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { eshopSwaggerDocumentBuilder, setupEshopSwaggerFromBuilder } from '@eshop/openapi-common';
import { bootstrapEshopHttpMicroservice } from '@eshop/observability';

type VersionedRequestLike = {
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
};

void bootstrapEshopHttpMicroservice(async () => (await import('./app.module')).AppModule, {
  tracingServiceName: 'ordering-service',
  defaultPort: 5053,
  configureApp: (app) => {
    app.enableVersioning({
      type: VersioningType.CUSTOM,
      defaultVersion: '1',
      extractor: (request: unknown) => {
        const req = request as VersionedRequestLike;
        const q = req.query?.['api-version'];
        const fromQuery = Array.isArray(q) ? q[0] : q;
        if (typeof fromQuery === 'string' && fromQuery.length) return fromQuery;
        const h = req.headers?.['api-version'];
        const fromHeader = Array.isArray(h) ? h[0] : h;
        if (typeof fromHeader === 'string' && fromHeader.length) return fromHeader;
        return '1';
      },
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    setupEshopSwaggerFromBuilder(
      app,
      eshopSwaggerDocumentBuilder(
        'Ordering API',
        'Nest Ordering service port (CQRS + Postgres + Rabbit + outbox)',
      ).build(),
      { ignoreGlobalPrefix: false },
    );
  },
});
