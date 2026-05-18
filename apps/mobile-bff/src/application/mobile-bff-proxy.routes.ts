import type { MobileBffUpstreamKey } from '../infrastructure/proxy/mobile-bff-proxy.config';

export type MobileBffProxyRoute = {
  mountPath: string;
  upstream: MobileBffUpstreamKey;
  /** Path on the upstream Nest host (defaults to {@link mountPath}). */
  upstreamPathPrefix?: string;
};

/** Mobile gateway route table (catalog, ordering, basket, identity upstreams). */
export const MOBILE_BFF_PROXY_ROUTES: readonly MobileBffProxyRoute[] = [
  { mountPath: '/catalog-api', upstream: 'catalog', upstreamPathPrefix: '/api/catalog' },
  { mountPath: '/api/catalog', upstream: 'catalog' },
  { mountPath: '/api/orders', upstream: 'ordering' },
  { mountPath: '/api/basket', upstream: 'basket' },
  { mountPath: '/identity', upstream: 'identity', upstreamPathPrefix: '/api' },
] as const;
