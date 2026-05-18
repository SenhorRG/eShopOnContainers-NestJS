import 'reflect-metadata';

import { setupEshopSwaggerUi } from '@eshop/openapi-common';
import { bootstrapEshopHttpMicroservice } from '@eshop/observability';

import { loadMobileBffOpenApiDocument } from './api/mobile-bff-openapi.document';
import { registerMobileBffProxyRoutes } from './api/mobile-bff-proxy.registrar';

void bootstrapEshopHttpMicroservice(async () => (await import('./app.module')).AppModule, {
  tracingServiceName: 'mobile-bff',
  defaultPort: 5070,
  configureApp: (app) => {
    setupEshopSwaggerUi(app, loadMobileBffOpenApiDocument());
    /** Register before listen so proxies can observe bodies without duplicate parsing. */
    registerMobileBffProxyRoutes(app);
  },
});
