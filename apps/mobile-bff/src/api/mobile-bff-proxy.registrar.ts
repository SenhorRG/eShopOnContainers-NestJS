import type { INestApplication } from '@nestjs/common';

import { MobileBffProxyService } from '../application/mobile-bff-proxy.service';

/** Register before listen so proxies can observe bodies without duplicate parsing. */
export function registerMobileBffProxyRoutes(app: INestApplication): void {
  app.get(MobileBffProxyService).registerProxyRoutes(app);
}
