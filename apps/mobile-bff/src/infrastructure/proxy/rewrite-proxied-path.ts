/**
 * Express strips {@link mountPath} before http-proxy-middleware runs; upstream Nest apps
 * expect the full public path (e.g. `/api/basket`), not `/` alone.
 */
export function rewriteProxiedPath(strippedPath: string, upstreamPathPrefix: string): string {
  const prefix = upstreamPathPrefix.endsWith('/')
    ? upstreamPathPrefix.slice(0, -1)
    : upstreamPathPrefix;
  if (strippedPath === '/' || strippedPath === '') {
    return prefix;
  }
  const suffix = strippedPath.startsWith('/') ? strippedPath : `/${strippedPath}`;
  return `${prefix}${suffix}`;
}
