import type { INestApplication } from '@nestjs/common';
import { type DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Swagger UI mount path (browser). */
export const ESHOP_SWAGGER_UI_PATH = 'api/docs';

/** OpenAPI JSON served alongside the UI (`GET /api/docs-json`). */
export const ESHOP_SWAGGER_JSON_PATH = 'api/docs-json';

export interface SetupEshopSwaggerUiOptions {
  ignoreGlobalPrefix?: boolean;
}

export function setupEshopSwaggerUi(app: INestApplication, document: OpenAPIObject): void {
  SwaggerModule.setup(ESHOP_SWAGGER_UI_PATH, app, document, {
    jsonDocumentUrl: ESHOP_SWAGGER_JSON_PATH,
  });
}

export function setupEshopSwaggerFromBuilder(
  app: INestApplication,
  builder: ReturnType<DocumentBuilder['build']>,
  options?: SetupEshopSwaggerUiOptions,
): void {
  const document = SwaggerModule.createDocument(app, builder, {
    ignoreGlobalPrefix: options?.ignoreGlobalPrefix ?? false,
  });
  setupEshopSwaggerUi(app, document);
}
