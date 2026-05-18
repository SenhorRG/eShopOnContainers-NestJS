import { ICommand, IQuery } from '@nestjs/cqrs';

import type { OrderingCreateOrderPayload } from '../../api/ordering/ordering.dto';

export type IdentifiedOrderingEnvelopeInner = { commandNameForRequestRow: string };

export class IdentifiedCreateOrderCommand implements ICommand, IdentifiedOrderingEnvelopeInner {
  readonly commandNameForRequestRow = 'CreateOrderCommand';

  constructor(
    readonly requestId: string,
    readonly body: OrderingCreateOrderPayload,
  ) {}
}

export class IdentifiedCancelOrderCommand implements ICommand, IdentifiedOrderingEnvelopeInner {
  readonly commandNameForRequestRow = 'CancelOrderCommand';

  constructor(
    readonly requestId: string,
    readonly orderNumber: number,
  ) {}
}

export class IdentifiedShipOrderCommand implements ICommand, IdentifiedOrderingEnvelopeInner {
  readonly commandNameForRequestRow = 'ShipOrderCommand';

  constructor(
    readonly requestId: string,
    readonly orderNumber: number,
  ) {}
}

export class CreateOrderDraftCqrsCommand implements ICommand {
  constructor(
    readonly buyerId: string,
    readonly items: Array<{ productId: number; quantity: number; productName: string; pictureUrl?: string; unitPrice: number }>,
  ) {}
}

export class SetAwaitingValidationOrderCommand implements ICommand {
  constructor(readonly orderId: number) {}
}

export class SetStockConfirmedOrderCommand implements ICommand {
  constructor(readonly orderId: number) {}
}

export class SetStockRejectedOrderCommand implements ICommand {
  constructor(
    readonly orderId: number,
    readonly rejectedProductIds: number[],
  ) {}
}

export class SetPaidOrderCommand implements ICommand {
  constructor(readonly orderId: number) {}
}

export class CancelPlainOrderCommand implements ICommand {
  constructor(readonly orderNumber: number) {}
}

export class GetOrderByIdQuery implements IQuery {
  constructor(readonly orderId: number) {}
}

export class GetOrdersForUserQuery implements IQuery {
  constructor(readonly userId: string) {}
}

export class GetCardTypesQuery implements IQuery {}

export type DraftOrderVm = {
  orderItems: Array<{
    productId: number;
    units: number;
    discount: number;
    pictureUrl?: string | null;
    productName?: string | null;
    unitPrice?: number | null;
  }>;
  total: number;
};

export type HttpOrderVm = {
  orderNumber: number;
  date: string;
  status: string;
  description: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  country?: string | null;
  orderItems: Array<{
    productName?: string | null;
    units: number;
    unitPrice: number;
    pictureUrl?: string | null;
  }>;
  total: number;
};

export type OrderSummaryVm = {
  orderNumber: number;
  date: string;
  status: string;
  total: number;
};

export type CardTypeVm = { id: number; name: string };
