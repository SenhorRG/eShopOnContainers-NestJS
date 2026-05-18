import { createProxyMiddleware } from 'http-proxy-middleware';

import { forwardProxyRequestHeaders } from './forward-proxy-request-headers';
import { rewriteProxiedPath } from './rewrite-proxied-path';

export function createResilientProxyMiddleware(
  target: string,
  timeoutMs: number,
  upstreamPathPrefix: string,
) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: timeoutMs,
    proxyTimeout: timeoutMs,
    pathRewrite: (path) => rewriteProxiedPath(path, upstreamPathPrefix),
    on: {
      proxyReq: (proxyReq, req) => {
        forwardProxyRequestHeaders(proxyReq, req);
      },
    },
  });
}
