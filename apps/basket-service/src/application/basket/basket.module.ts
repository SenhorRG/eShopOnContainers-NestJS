import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { EventBusModule, eventBusOptionsFromEnv } from '@eshop/event-bus-amqp/nest';
import {
  EshopAuthModule,
  splitDelimitedEnvList,
  symmetricJwtSecretFromEnv,
} from '@eshop/auth';

import { BasketGrpcIdentityService } from '../../api/grpc/basket-grpc-identity.service';
import { BasketGrpcController } from '../../api/grpc/basket.grpc.controller';
import { BasketAuthGuard } from '../../api/http/auth/basket-auth.guard';
import { BasketHttpController } from '../../api/http/basket-http.controller';
import { BasketInboxLedgerService } from '../../integration/basket-inbox-ledger.service';
import { OrderStartedIntegrationEventHandler } from '../../integration/order-started.integration-event.handler';
import { RedisBasketRepository } from '../../infrastructure/redis-basket.repository';
import { RedisModule } from '../../infrastructure/redis.module';
import { BASKET_REPOSITORY } from './basket.tokens';

const DEFAULT_QUEUE = 'basket-api';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    EshopAuthModule.register({
      symmetricSecret: symmetricJwtSecretFromEnv('ESHOP_BASKET_JWT_SECRET'),
      jwksUri: process.env.ESHOP_JWT_JWKS_URI,
      validIssuers: splitDelimitedEnvList(process.env.ESHOP_JWT_ISSUERS),
      audience: process.env.ESHOP_JWT_AUDIENCE,
      validateAudience:
        (process.env.ESHOP_JWT_VALIDATE_AUDIENCE ?? '').trim().toLowerCase() === 'true',
    }),
    EventBusModule.registerAsync({
      useFactory: () =>
        eventBusOptionsFromEnv(process.env.ESHOP_EVENT_BUS_QUEUE_BASKET ?? DEFAULT_QUEUE, {
          consumerAckPolicy: 'afterHandlerSuccess',
        }),
    }),
    RedisModule,
  ],
  controllers: [BasketGrpcController, BasketHttpController],
  providers: [
    BasketGrpcIdentityService,
    BasketAuthGuard,
    RedisBasketRepository,
    { provide: BASKET_REPOSITORY, useExisting: RedisBasketRepository },
    BasketInboxLedgerService,
    OrderStartedIntegrationEventHandler,
  ],
  exports: [BASKET_REPOSITORY],
})
export class BasketModule {}
