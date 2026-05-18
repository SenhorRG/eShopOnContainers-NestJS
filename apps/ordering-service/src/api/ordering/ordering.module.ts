import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { PassportModule } from '@nestjs/passport';

import { EventBusModule, eventBusOptionsFromEnv } from '@eshop/event-bus-amqp/nest';
import {
  EshopAuthModule,
  splitDelimitedEnvList,
  symmetricJwtSecretFromEnv,
} from '@eshop/auth';

import { GracePeriodConfirmedConsumer } from '../../integration/consumers/grace-period-confirmed.consumer';
import { OrderPaymentFailedConsumer } from '../../integration/consumers/order-payment-failed.consumer';
import { OrderPaymentSucceededConsumer } from '../../integration/consumers/order-payment-succeeded.consumer';
import { OrderStockConfirmedConsumer } from '../../integration/consumers/order-stock-confirmed.consumer';
import { OrderStockRejectedConsumer } from '../../integration/consumers/order-stock-rejected.consumer';
import { OrderingInboxLedgerService } from '../../integration/ordering-inbox-ledger.service';
import { OrderingIntegrationEventService } from '../../integration/ordering-integration-event.service';
import { OrderingProcessedEventsGcService } from '../../integration/ordering-processed-events-gc.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { OrderingAuthGuard } from './auth/ordering-auth.guard';
import {
  CancelPlainOrderHandler,
  CreateOrderDraftHandler,
  IdentifiedCancelOrderHandler,
  IdentifiedCreateOrderHandler,
  IdentifiedShipOrderHandler,
  SetAwaitingValidationHandler,
  SetPaidHandler,
  SetStockConfirmedHandler,
  SetStockRejectedHandler,
} from '../../application/ordering/ordering.command-handlers';
import { OrderingCreateOrderWorkflow } from '../../application/ordering/ordering-create.workflow';
import { OrderingDomainIntegrationPublisher } from '../../application/ordering/ordering-domain-integration.publisher';
import { OrderingPersistenceFacade } from '../../application/ordering/ordering-persistence.facade';
import { OrderingRequestManager } from '../../application/ordering/ordering-request.manager';
import { GetCardTypesHandler, GetOrderByIdHandler, GetOrdersForUserHandler } from '../../application/ordering/ordering.query-handlers';
import { OrdersHttpController } from './orders-http.controller';

const DEFAULT_QUEUE = 'ordering-api';

@Module({
  imports: [
    CqrsModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    EshopAuthModule.register({
      symmetricSecret: symmetricJwtSecretFromEnv('ESHOP_ORDERING_JWT_SECRET'),
      jwksUri: process.env.ESHOP_JWT_JWKS_URI,
      validIssuers: splitDelimitedEnvList(process.env.ESHOP_JWT_ISSUERS),
      audience: process.env.ESHOP_JWT_AUDIENCE,
      validateAudience:
        (process.env.ESHOP_JWT_VALIDATE_AUDIENCE ?? '').trim().toLowerCase() === 'true',
    }),
    PassportModule.register({ session: false }),
    EventBusModule.registerAsync({
      useFactory: () =>
        eventBusOptionsFromEnv(process.env.ESHOP_EVENT_BUS_QUEUE_ORDERING ?? DEFAULT_QUEUE),
    }),
  ],
  controllers: [OrdersHttpController],
  providers: [
    OrderingAuthGuard,
    OrderingIntegrationEventService,
    OrderingInboxLedgerService,
    OrderingProcessedEventsGcService,
    OrderingDomainIntegrationPublisher,
    OrderingPersistenceFacade,
    OrderingCreateOrderWorkflow,
    OrderingRequestManager,
    IdentifiedCreateOrderHandler,
    IdentifiedCancelOrderHandler,
    IdentifiedShipOrderHandler,
    CreateOrderDraftHandler,
    SetAwaitingValidationHandler,
    SetStockConfirmedHandler,
    SetStockRejectedHandler,
    SetPaidHandler,
    CancelPlainOrderHandler,
    GetOrderByIdHandler,
    GetOrdersForUserHandler,
    GetCardTypesHandler,
    OrderStockConfirmedConsumer,
    OrderStockRejectedConsumer,
    GracePeriodConfirmedConsumer,
    OrderPaymentSucceededConsumer,
    OrderPaymentFailedConsumer,
  ],
})
export class OrderingModule {}
