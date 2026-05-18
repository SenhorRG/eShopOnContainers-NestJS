import type { IntegrationEvent, IntegrationJson } from '@eshop/event-bus-amqp';

import type { IntegrationEventLogRow } from '@eshop/outbox';
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

import { normalizeOrderingStoredEventTypeName } from './resolve-ordering-integration-emit-name';

function coerceJson(row: IntegrationEventLogRow): IntegrationJson {
  return JSON.parse(row.content) as IntegrationJson;
}

/** Restores subclasses from outbox persistence for post-commit Rabbit publish. */
export function reviveOrderingIntegrationFromLogRow(row: IntegrationEventLogRow): IntegrationEvent {
  const j = coerceJson(row);
  const storedFullName = normalizeOrderingStoredEventTypeName(row.eventTypeName);
  switch (storedFullName) {
    case OrderingEmitEventFullNames.OrderStartedIntegrationEvent:
      return OrderStartedIntegrationEvent.revive(j as Record<string, unknown>);
    case OrderingEmitEventFullNames.OrderStatusChangedToSubmittedIntegrationEvent:
      return OrderStatusChangedToSubmittedIntegrationEvent.revive(j as IntegrationJson);
    case OrderingEmitEventFullNames.OrderStatusChangedToAwaitingValidationIntegrationEvent:
      return OrderStatusChangedToAwaitingValidationIntegrationEvent.revive(j as IntegrationJson);
    case OrderingEmitEventFullNames.OrderStatusChangedToStockConfirmedIntegrationEvent:
      return OrderStatusChangedToStockConfirmedIntegrationEvent.revive(j as IntegrationJson);
    case OrderingEmitEventFullNames.OrderStatusChangedToPaidIntegrationEvent:
      return OrderStatusChangedToPaidIntegrationEvent.revive(j as IntegrationJson);
    case OrderingEmitEventFullNames.OrderStatusChangedToCancelledIntegrationEvent:
      return OrderStatusChangedToCancelledIntegrationEvent.revive(j as IntegrationJson);
    case OrderingEmitEventFullNames.OrderStatusChangedToShippedIntegrationEvent:
      return OrderStatusChangedToShippedIntegrationEvent.revive(j as IntegrationJson);
    default:
      throw new Error(`Unsupported ordering integration EventTypeName: ${row.eventTypeName}`);
  }
}
