import { Logger } from '@nestjs/common';
import type { Prisma } from '@ordering/prisma-client';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Order, type OrderItem } from '@eshop/ordering-domain';

import { OrderingIntegrationEventService } from '../../integration/ordering-integration-event.service';

import { orderingCommandDelay } from './ordering-command-delay';
import {
  CancelPlainOrderCommand,
  CreateOrderDraftCqrsCommand,
  IdentifiedCancelOrderCommand,
  IdentifiedCreateOrderCommand,
  IdentifiedShipOrderCommand,
  SetAwaitingValidationOrderCommand,
  SetPaidOrderCommand,
  SetStockConfirmedOrderCommand,
  SetStockRejectedOrderCommand,
  type DraftOrderVm,
} from './ordering.cqrs';
import { OrderingCreateOrderWorkflow } from '../../application/ordering/ordering-create.workflow';
import { OrderingDomainIntegrationPublisher } from '../../application/ordering/ordering-domain-integration.publisher';
import { OrderingPersistenceFacade } from '../../application/ordering/ordering-persistence.facade';
import { OrderingRequestManager } from '../../application/ordering/ordering-request.manager';
import type { OrderingCreateOrderPayload } from '../../api/ordering/ordering.dto';

@CommandHandler(IdentifiedCreateOrderCommand)
export class IdentifiedCreateOrderHandler implements ICommandHandler<IdentifiedCreateOrderCommand, boolean> {
  private readonly log = new Logger(IdentifiedCreateOrderHandler.name);

  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly requests: OrderingRequestManager,
    private readonly createFlow: OrderingCreateOrderWorkflow,
  ) {}

  async execute(cmd: IdentifiedCreateOrderCommand): Promise<boolean> {
    const bodyForLog: OrderingCreateOrderPayload = cmd.body;

    try {
      return await this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
        const inserted = await this.requests.createIfAbsent(prismaTx, cmd.requestId, cmd.commandNameForRequestRow);
        if (!inserted) {
          return true;
        }

        await this.createFlow.executeSubmitted(prismaTx, enqueueIntegrationEvent, cmd.body);
        const mask = '[card-redacted]';
        this.log.log(
          `CreateOrder persisted for user=${bodyForLog.userId}; items=${bodyForLog.items.length}; cc=${mask}`,
        );
        return true;
      });
    } catch (err) {
      this.log.error(err);
      return false;
    }
  }
}

@CommandHandler(IdentifiedCancelOrderCommand)
export class IdentifiedCancelOrderHandler implements ICommandHandler<IdentifiedCancelOrderCommand, boolean> {
  private readonly log = new Logger(IdentifiedCancelOrderHandler.name);

  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly requests: OrderingRequestManager,
    private readonly persistence: OrderingPersistenceFacade,
    private readonly domainEnqueue: OrderingDomainIntegrationPublisher,
  ) {}

  async execute(cmd: IdentifiedCancelOrderCommand): Promise<boolean> {
    try {
      return await this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
        const inserted = await this.requests.createIfAbsent(prismaTx, cmd.requestId, cmd.commandNameForRequestRow);
        if (!inserted) return true;

        return cancelOrderInTransaction(prismaTx, enqueueIntegrationEvent, cmd.orderNumber, this.persistence, this.domainEnqueue, {
          requireAggregate: true,
        });
      });
    } catch {
      return false;
    }
  }
}

@CommandHandler(IdentifiedShipOrderCommand)
export class IdentifiedShipOrderHandler implements ICommandHandler<IdentifiedShipOrderCommand, boolean> {
  private readonly log = new Logger(IdentifiedShipOrderHandler.name);

  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly requests: OrderingRequestManager,
    private readonly persistence: OrderingPersistenceFacade,
    private readonly domainEnqueue: OrderingDomainIntegrationPublisher,
  ) {}

  async execute(cmd: IdentifiedShipOrderCommand): Promise<boolean> {
    try {
      return await this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
        const inserted = await this.requests.createIfAbsent(prismaTx, cmd.requestId, cmd.commandNameForRequestRow);
        if (!inserted) return true;

        const aggregate = await this.persistence.loadOrderAggregate(prismaTx, cmd.orderNumber);
        if (!aggregate) {
          throw new Error(`ORDER_NOT_FOUND_SHIP:${cmd.orderNumber}`);
        }

        aggregate.setShippedStatus();
        const evs = aggregate.pullDomainEvents();
        await this.persistence.persistOrderAggregate(prismaTx, aggregate);
        await this.domainEnqueue.publishForEvents(prismaTx, enqueueIntegrationEvent, evs);
        return true;
      });
    } catch {
      return false;
    }
  }
}

@CommandHandler(CreateOrderDraftCqrsCommand)
export class CreateOrderDraftHandler implements ICommandHandler<CreateOrderDraftCqrsCommand, DraftOrderVm> {
  async execute(cmd: CreateOrderDraftCqrsCommand): Promise<DraftOrderVm> {
    const o = Order.newDraft();
    for (const it of cmd.items) {
      o.addOrderItem(it.productId, it.productName, it.unitPrice, 0, it.pictureUrl ?? '', it.quantity);
    }

    return {
      orderItems: o.orderItems.map((oi: OrderItem) => ({
        productId: oi.productId,
        units: oi.units,
        discount: oi.discount,
        pictureUrl: oi.pictureUrl,
        productName: oi.productName,
        unitPrice: oi.unitPrice,
      })),
      total: o.getTotal(),
    };
  }
}

@CommandHandler(SetAwaitingValidationOrderCommand)
export class SetAwaitingValidationHandler implements ICommandHandler<SetAwaitingValidationOrderCommand, boolean> {
  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly persistence: OrderingPersistenceFacade,
    private readonly domainEnqueue: OrderingDomainIntegrationPublisher,
  ) {}

  async execute(cmd: SetAwaitingValidationOrderCommand): Promise<boolean> {
    return this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
      const aggregate = await this.persistence.loadOrderAggregate(prismaTx, cmd.orderId);
      if (!aggregate) return false;

      aggregate.setAwaitingValidationStatus();
      const evs = aggregate.pullDomainEvents();
      await this.persistence.persistOrderAggregate(prismaTx, aggregate);
      await this.domainEnqueue.publishForEvents(prismaTx, enqueueIntegrationEvent, evs);
      return true;
    });
  }
}

@CommandHandler(SetStockConfirmedOrderCommand)
export class SetStockConfirmedHandler implements ICommandHandler<SetStockConfirmedOrderCommand, boolean> {
  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly persistence: OrderingPersistenceFacade,
    private readonly domainEnqueue: OrderingDomainIntegrationPublisher,
  ) {}

  async execute(cmd: SetStockConfirmedOrderCommand): Promise<boolean> {
    await orderingCommandDelay();
    return this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
      const aggregate = await this.persistence.loadOrderAggregate(prismaTx, cmd.orderId);
      if (!aggregate) return false;

      aggregate.setStockConfirmedStatus();
      const evs = aggregate.pullDomainEvents();
      await this.persistence.persistOrderAggregate(prismaTx, aggregate);
      await this.domainEnqueue.publishForEvents(prismaTx, enqueueIntegrationEvent, evs);
      return true;
    });
  }
}

@CommandHandler(SetStockRejectedOrderCommand)
export class SetStockRejectedHandler implements ICommandHandler<SetStockRejectedOrderCommand, boolean> {
  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly persistence: OrderingPersistenceFacade,
  ) {}

  async execute(cmd: SetStockRejectedOrderCommand): Promise<boolean> {
    await orderingCommandDelay();
    return this.integration.withOrderingOutbox(async ({ prismaTx }) => {
      const aggregate = await this.persistence.loadOrderAggregate(prismaTx, cmd.orderId);
      if (!aggregate) return false;

      aggregate.setCancelledStatusWhenStockIsRejected(cmd.rejectedProductIds);
      await this.persistence.persistOrderAggregate(prismaTx, aggregate);
      return true;
    });
  }
}

@CommandHandler(SetPaidOrderCommand)
export class SetPaidHandler implements ICommandHandler<SetPaidOrderCommand, boolean> {
  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly persistence: OrderingPersistenceFacade,
    private readonly domainEnqueue: OrderingDomainIntegrationPublisher,
  ) {}

  async execute(cmd: SetPaidOrderCommand): Promise<boolean> {
    await orderingCommandDelay();
    return this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
      const aggregate = await this.persistence.loadOrderAggregate(prismaTx, cmd.orderId);
      if (!aggregate) return false;

      aggregate.setPaidStatus();
      const evs = aggregate.pullDomainEvents();
      await this.persistence.persistOrderAggregate(prismaTx, aggregate);
      await this.domainEnqueue.publishForEvents(prismaTx, enqueueIntegrationEvent, evs);
      return true;
    });
  }
}

@CommandHandler(CancelPlainOrderCommand)
export class CancelPlainOrderHandler implements ICommandHandler<CancelPlainOrderCommand, boolean> {
  constructor(
    private readonly integration: OrderingIntegrationEventService,
    private readonly persistence: OrderingPersistenceFacade,
    private readonly domainEnqueue: OrderingDomainIntegrationPublisher,
  ) {}

  async execute(cmd: CancelPlainOrderCommand): Promise<boolean> {
    return this.integration.withOrderingOutbox(async ({ prismaTx, enqueueIntegrationEvent }) => {
      return cancelOrderInTransaction(prismaTx, enqueueIntegrationEvent, cmd.orderNumber, this.persistence, this.domainEnqueue, {
        requireAggregate: false,
      });
    });
  }
}

async function cancelOrderInTransaction(
  prismaTx: Prisma.TransactionClient,
  enqueue: Parameters<OrderingDomainIntegrationPublisher['publishForEvents']>[1],
  orderNumber: number,
  persistence: OrderingPersistenceFacade,
  domainEnqueue: OrderingDomainIntegrationPublisher,
  opts?: { requireAggregate?: boolean },
): Promise<boolean> {
  const aggregate = await persistence.loadOrderAggregate(prismaTx, orderNumber);
  if (!aggregate) {
    if (opts?.requireAggregate) {
      throw new Error(`ORDER_NOT_FOUND_CANCEL:${orderNumber}`);
    }

    return false;
  }

  aggregate.setCancelledStatus();
  const evs = aggregate.pullDomainEvents();
  await persistence.persistOrderAggregate(prismaTx, aggregate);
  await domainEnqueue.publishForEvents(prismaTx, enqueue, evs);
  return true;
}
