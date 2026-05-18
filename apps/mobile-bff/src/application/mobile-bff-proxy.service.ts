import { Injectable } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

import { applyExpressTrustProxy, getExpressInstance } from '../infrastructure/express/trust-proxy.setup';
import { MobileBffProxyConfig } from '../infrastructure/proxy/mobile-bff-proxy.config';
import { createResilientProxyMiddleware } from '../infrastructure/proxy/resilient-proxy.middleware.factory';

import { MOBILE_BFF_PROXY_ROUTES } from './mobile-bff-proxy.routes';

/**
 * Registers reverse-proxy mounts on the Nest/Express instance.
 * Express strips the mount segment; {@link rewriteProxiedPath} restores the upstream path.
 */
@Injectable()
export class MobileBffProxyService {
  constructor(private readonly config: MobileBffProxyConfig) {}

  registerProxyRoutes(app: INestApplication): void {
    applyExpressTrustProxy(app, this.config.trustProxyHops);

    const express = getExpressInstance(app);
    if (!express) return;

    for (const route of MOBILE_BFF_PROXY_ROUTES) {
      const target = this.config.resolveTarget(route.upstream);
      if (!target) continue;
      const upstreamPathPrefix = route.upstreamPathPrefix ?? route.mountPath;
      express.use(
        route.mountPath,
        createResilientProxyMiddleware(target, this.config.proxyTimeoutMs, upstreamPathPrefix),
      );
    }
  }
}
