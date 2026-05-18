import { DocumentBuilder } from '@nestjs/swagger';

export {
  ESHOP_SWAGGER_JSON_PATH,
  ESHOP_SWAGGER_UI_PATH,
  setupEshopSwaggerFromBuilder,
  setupEshopSwaggerUi,
} from './setup-eshop-swagger-ui';
export type { SetupEshopSwaggerUiOptions } from './setup-eshop-swagger-ui';

/**
 * Shared Swagger metadata: Bearer auth + optional `api-version` header (Nest CUSTOM versioning also reads query).
 */
export function eshopSwaggerDocumentBuilder(
  title: string,
  description: string,
  version = '1.0',
): DocumentBuilder {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .addGlobalParameters({
      name: 'api-version',
      in: 'header',
      required: false,
      schema: { type: 'string', example: '1.0' },
      description:
        'API version (may also appear as query `api-version=`). Applies when services use header/query versioning.',
    });
}
