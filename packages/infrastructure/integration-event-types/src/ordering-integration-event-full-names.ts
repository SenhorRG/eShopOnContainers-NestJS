/** Persisted `EventTypeName` values for ordering integration events (outbox / integration log). */
export const OrderingEmitEventFullNames = {
  OrderStartedIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStartedIntegrationEvent',
  OrderStatusChangedToSubmittedIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStatusChangedToSubmittedIntegrationEvent',
  OrderStatusChangedToAwaitingValidationIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStatusChangedToAwaitingValidationIntegrationEvent',
  OrderStatusChangedToStockConfirmedIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStatusChangedToStockConfirmedIntegrationEvent',
  OrderStatusChangedToPaidIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStatusChangedToPaidIntegrationEvent',
  OrderStatusChangedToCancelledIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStatusChangedToCancelledIntegrationEvent',
  OrderStatusChangedToShippedIntegrationEvent:
    'eShop.Ordering.API.Application.IntegrationEvents.Events.OrderStatusChangedToShippedIntegrationEvent',
} as const;
