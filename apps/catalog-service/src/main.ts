import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { Request } from 'express';

import { eshopSwaggerDocumentBuilder, setupEshopSwaggerFromBuilder } from '@eshop/openapi-common';
import { bootstrapEshopHttpMicroservice } from '@eshop/observability';

import { ApiSupportedVersionsInterceptor } from './api/interceptors/api-supported-versions.interceptor';

void bootstrapEshopHttpMicroservice(async () => (await import('./app.module')).AppModule, {
  tracingServiceName: 'catalog-service',
  defaultPort: 5052,
  configureApp: (app) => {
    app.enableVersioning({
      type: VersioningType.CUSTOM,
      defaultVersion: '1.0',
      extractor: (request: unknown) => {
        const req = request as Request;
        const q = req.query?.['api-version'];
        const fromQuery = Array.isArray(q) ? q[0] : q;
        if (typeof fromQuery === 'string' && fromQuery.length) return fromQuery;
        const h = req.headers['api-version'];
        const fromHeader = Array.isArray(h) ? h[0] : h;
        if (typeof fromHeader === 'string' && fromHeader.length) return fromHeader;
        return '1.0';
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
    app.useGlobalInterceptors(new ApiSupportedVersionsInterceptor());

    setupEshopSwaggerFromBuilder(
      app,
      eshopSwaggerDocumentBuilder('Catalog API', 'Catalog HTTP API (v1 / v2)').build(),
      { ignoreGlobalPrefix: false },
    );
  },
});
