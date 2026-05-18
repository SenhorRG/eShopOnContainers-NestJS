import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { OpenAPIObject } from '@nestjs/swagger';

/** Monorepo root: dist/api → apps/mobile-bff → apps → root */
const MOBILE_BFF_OPENAPI_JSON = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'contracts',
  'openapi',
  'nest',
  'mobile-bff.openapi.json',
);

export function loadMobileBffOpenApiDocument(): OpenAPIObject {
  return JSON.parse(readFileSync(MOBILE_BFF_OPENAPI_JSON, 'utf8')) as OpenAPIObject;
}
