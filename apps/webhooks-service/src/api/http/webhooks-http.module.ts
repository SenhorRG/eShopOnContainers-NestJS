import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import {
  EshopAuthModule,
  splitDelimitedEnvList,
  symmetricJwtSecretFromEnv,
} from '@eshop/auth';

import { WebhooksCoreModule } from '../../webhooks-core.module';

import { WebhooksAuthGuard } from './webhooks-auth.guard';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    WebhooksCoreModule,
    EshopAuthModule.register({
      symmetricSecret: symmetricJwtSecretFromEnv('ESHOP_WEBHOOKS_JWT_SECRET'),
      jwksUri: process.env.ESHOP_JWT_JWKS_URI,
      validIssuers: splitDelimitedEnvList(process.env.ESHOP_JWT_ISSUERS),
      audience: process.env.ESHOP_JWT_AUDIENCE,
      validateAudience:
        (process.env.ESHOP_JWT_VALIDATE_AUDIENCE ?? '').trim().toLowerCase() === 'true',
    }),
    PassportModule.register({ session: false }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksAuthGuard],
})
export class WebhooksHttpModule {}
