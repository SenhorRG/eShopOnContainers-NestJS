import { Module } from '@nestjs/common';

import { MobileBffProxyConfig } from '../infrastructure/proxy/mobile-bff-proxy.config';
import { UpstreamHttpClient } from '../infrastructure/http/upstream-http.client';

import { MobileBffProxyService } from './mobile-bff-proxy.service';
import { MobileBffUpstreamAggregator } from './mobile-bff-upstream.aggregator';

@Module({
  providers: [
    {
      provide: MobileBffProxyConfig,
      useFactory: () => new MobileBffProxyConfig(),
    },
    {
      provide: UpstreamHttpClient,
      useFactory: (config: MobileBffProxyConfig) => new UpstreamHttpClient(config),
      inject: [MobileBffProxyConfig],
    },
    MobileBffProxyService,
    MobileBffUpstreamAggregator,
  ],
  exports: [
    MobileBffProxyService,
    MobileBffUpstreamAggregator,
    UpstreamHttpClient,
    MobileBffProxyConfig,
  ],
})
export class MobileBffModule {}
