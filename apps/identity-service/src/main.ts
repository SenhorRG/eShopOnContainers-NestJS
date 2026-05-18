import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { eshopSwaggerDocumentBuilder, setupEshopSwaggerFromBuilder } from '@eshop/openapi-common';
import { bootstrapEshopHttpMicroservice } from '@eshop/observability';

void bootstrapEshopHttpMicroservice(async () => (await import('./app.module')).AppModule, {
  tracingServiceName: 'identity-service',
  defaultPort: 5051,
  configureApp: (app) => {
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
        'Identity API',
        'Local account registration and JWT issuance for the Nest stack',
      ).build(),
      { ignoreGlobalPrefix: false },
    );
  },
});
