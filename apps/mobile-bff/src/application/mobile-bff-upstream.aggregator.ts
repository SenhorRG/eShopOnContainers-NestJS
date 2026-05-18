import { Injectable } from '@nestjs/common';
import { axiosWithPolicy } from '@eshop/http-resilience';

import type { MobileBffUpstreamKey } from '../infrastructure/proxy/mobile-bff-proxy.config';
import { UpstreamHttpClient } from '../infrastructure/http/upstream-http.client';

export type UpstreamProbeResult = {
  upstream: MobileBffUpstreamKey;
  reachable: boolean;
};

/**
 * Parallel outbound probes for operations/diagnostics (not exposed as HTTP by default).
 * Uses resilient axios clients from {@link UpstreamHttpClient}.
 */
@Injectable()
export class MobileBffUpstreamAggregator {
  constructor(private readonly upstreamHttp: UpstreamHttpClient) {}

  async probeUpstreams(
    keys: readonly MobileBffUpstreamKey[] = ['catalog', 'ordering', 'identity'],
  ): Promise<UpstreamProbeResult[]> {
    const probes = keys.map(async (upstream) => {
      const client = this.upstreamHttp.forUpstream(upstream);
      if (!client) {
        return { upstream, reachable: false };
      }
      try {
        await axiosWithPolicy(client, { method: 'get', url: '/health' });
        return { upstream, reachable: true };
      } catch {
        return { upstream, reachable: false };
      }
    });
    return Promise.all(probes);
  }
}
