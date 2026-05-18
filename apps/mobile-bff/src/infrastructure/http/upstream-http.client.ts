import { createResilientAxios, type ResilientAxiosPolicy } from '@eshop/http-resilience';

import type { MobileBffProxyConfig, MobileBffUpstreamKey } from '../proxy/mobile-bff-proxy.config';

export class UpstreamHttpClient {
  private readonly clients = new Map<MobileBffUpstreamKey, ResilientAxiosPolicy>();

  constructor(private readonly config: MobileBffProxyConfig) {}

  forUpstream(upstream: MobileBffUpstreamKey): ResilientAxiosPolicy | undefined {
    const baseURL = this.config.resolveTarget(upstream);
    if (!baseURL) return undefined;

    let client = this.clients.get(upstream);
    if (!client) {
      client = createResilientAxios('bffUpstream', { baseURL });
      this.clients.set(upstream, client);
    }
    return client;
  }
}
