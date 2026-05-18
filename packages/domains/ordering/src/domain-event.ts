export type DomainEvent =
  | OrderStartedDomainEvent
  | OrderStatusChangedToAwaitingValidationDomainEvent
  | OrderStatusChangedToStockConfirmedDomainEvent
  | OrderStatusChangedToPaidDomainEvent
  | OrderShippedDomainEvent
  | OrderCancelledDomainEvent;

export type OrderStartedDomainEvent = {
  readonly type: 'OrderStartedDomainEvent';
  readonly orderId: number;
  readonly userId: string;
  readonly userName: string;
  readonly cardTypeId: number;
  readonly cardNumber: string;
  readonly cardSecurityNumber: string;
  readonly cardHolderName: string;
  readonly cardExpiration: Date;
};

export type OrderStatusChangedToAwaitingValidationDomainEvent = {
  readonly type: 'OrderStatusChangedToAwaitingValidationDomainEvent';
  readonly orderId: number;
  readonly orderItems: ReadonlyArray<{
    productId: number;
    units: number;
    productName: string;
  }>;
};

export type OrderStatusChangedToStockConfirmedDomainEvent = {
  readonly type: 'OrderStatusChangedToStockConfirmedDomainEvent';
  readonly orderId: number;
};

export type OrderStatusChangedToPaidDomainEvent = {
  readonly type: 'OrderStatusChangedToPaidDomainEvent';
  readonly orderId: number;
  readonly orderItems: ReadonlyArray<{
    productId: number;
    units: number;
  }>;
};

export type OrderShippedDomainEvent = {
  readonly type: 'OrderShippedDomainEvent';
  readonly orderId: number;
};

export type OrderCancelledDomainEvent = {
  readonly type: 'OrderCancelledDomainEvent';
  readonly orderId: number;
};
