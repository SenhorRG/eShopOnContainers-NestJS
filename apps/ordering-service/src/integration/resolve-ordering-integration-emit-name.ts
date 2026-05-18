import type { IntegrationEvent } from '@eshop/event-bus-amqp';
import {
  OrderStartedIntegrationEvent,
  OrderStatusChangedToAwaitingValidationIntegrationEvent,
  OrderStatusChangedToCancelledIntegrationEvent,
  OrderStatusChangedToPaidIntegrationEvent,
  OrderStatusChangedToShippedIntegrationEvent,
  OrderStatusChangedToStockConfirmedIntegrationEvent,
  OrderStatusChangedToSubmittedIntegrationEvent,
  OrderingEmitEventFullNames,
} from '@eshop/integration-event-types';

/** Normalizes persisted `EventTypeName` (full type name or short name) to `OrderingEmitEventFullNames` keys. */
export function normalizeOrderingStoredEventTypeName(stored: string): string {
  const shortToFull: Record<string, string> = {
    [OrderStartedIntegrationEvent.name]: OrderingEmitEventFullNames.OrderStartedIntegrationEvent,
    [OrderStatusChangedToSubmittedIntegrationEvent.name]:
      OrderingEmitEventFullNames.OrderStatusChangedToSubmittedIntegrationEvent,
    [OrderStatusChangedToAwaitingValidationIntegrationEvent.name]:
      OrderingEmitEventFullNames.OrderStatusChangedToAwaitingValidationIntegrationEvent,
    [OrderStatusChangedToStockConfirmedIntegrationEvent.name]:
      OrderingEmitEventFullNames.OrderStatusChangedToStockConfirmedIntegrationEvent,
    [OrderStatusChangedToPaidIntegrationEvent.name]: OrderingEmitEventFullNames.OrderStatusChangedToPaidIntegrationEvent,
    [OrderStatusChangedToCancelledIntegrationEvent.name]:
      OrderingEmitEventFullNames.OrderStatusChangedToCancelledIntegrationEvent,
    [OrderStatusChangedToShippedIntegrationEvent.name]:
      OrderingEmitEventFullNames.OrderStatusChangedToShippedIntegrationEvent,
  };

  return shortToFull[stored] ?? stored;
}

export function resolveOrderingIntegrationEmitName(event: IntegrationEvent): string {
  switch (event.constructor.name) {
    case OrderStartedIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStartedIntegrationEvent;
    case OrderStatusChangedToSubmittedIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStatusChangedToSubmittedIntegrationEvent;
    case OrderStatusChangedToAwaitingValidationIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStatusChangedToAwaitingValidationIntegrationEvent;
    case OrderStatusChangedToStockConfirmedIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStatusChangedToStockConfirmedIntegrationEvent;
    case OrderStatusChangedToPaidIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStatusChangedToPaidIntegrationEvent;
    case OrderStatusChangedToCancelledIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStatusChangedToCancelledIntegrationEvent;
    case OrderStatusChangedToShippedIntegrationEvent.name:
      return OrderingEmitEventFullNames.OrderStatusChangedToShippedIntegrationEvent;
    default:
      return event.constructor.name;
  }
}
