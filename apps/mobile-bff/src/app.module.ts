import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { MobileBffModule } from './application/mobile-bff.module';
import { mobileBffThrottlerOptionsFromEnv } from './infrastructure/rate-limit/mobile-bff-throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(mobileBffThrottlerOptionsFromEnv()),
    ObservabilityModule.forRoot(),
    HealthModule.register({}),
    MobileBffModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
