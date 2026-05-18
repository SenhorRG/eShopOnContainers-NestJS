export type MobileBffUpstreamKey = 'catalog' | 'ordering' | 'identity' | 'basket';

export class MobileBffProxyConfig {
  readonly catalogTarget: string;
  readonly orderingTarget: string;
  readonly identityTarget: string;
  readonly basketTarget: string;
  readonly identityEnabled: boolean;
  readonly trustProxyHops: number;
  readonly proxyTimeoutMs: number;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.catalogTarget = normalizeTarget(
      env.ESHOP_BFF_PROXY_CATALOG_URL ?? 'http://127.0.0.1:5052',
    );
    this.orderingTarget = normalizeTarget(
      env.ESHOP_BFF_PROXY_ORDERING_URL ?? 'http://127.0.0.1:5053',
    );
    this.identityTarget = normalizeTarget(
      env.ESHOP_BFF_PROXY_IDENTITY_URL ?? 'http://127.0.0.1:5051',
    );
    this.basketTarget = normalizeTarget(
      env.ESHOP_BFF_PROXY_BASKET_URL ?? 'http://127.0.0.1:5054',
    );
    this.identityEnabled = !isTruthyEnvFalse(env.ESHOP_BFF_PROXY_IDENTITY_ENABLED);
    const hops = Number(env.ESHOP_BFF_PROXY_TRUST_HOPS ?? '1');
    this.trustProxyHops = Number.isFinite(hops) && hops >= 0 ? Math.floor(hops) : 1;
    const timeoutRaw = Number(env.ESHOP_BFF_PROXY_TIMEOUT_MS ?? '120000');
    this.proxyTimeoutMs =
      Number.isFinite(timeoutRaw) && timeoutRaw > 1000 ? Math.floor(timeoutRaw) : 120_000;
  }

  resolveTarget(upstream: MobileBffUpstreamKey): string | undefined {
    if (upstream === 'catalog') return this.catalogTarget;
    if (upstream === 'ordering') return this.orderingTarget;
    if (upstream === 'basket') return this.basketTarget;
    if (!this.identityEnabled || this.identityTarget.length === 0) return undefined;
    return this.identityTarget;
  }
}

function normalizeTarget(url: string): string {
  const s = url.trim();
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

function isTruthyEnvFalse(raw?: string): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === '0' || v === 'false' || v === 'no' || v === 'off';
}
