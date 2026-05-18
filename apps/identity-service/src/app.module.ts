import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule, requireProcessEnv } from '@eshop/health';
import { ObservabilityModule } from '@eshop/observability';

import { AuthModule } from './api/auth/auth.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot(),
    HealthModule.register({
      postgresUrl: requireProcessEnv('ESHOP_IDENTITY_DATABASE_URL'),
    }),
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule {}
