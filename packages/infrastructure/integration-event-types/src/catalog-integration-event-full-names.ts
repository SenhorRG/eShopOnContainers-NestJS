/** Persisted `EventTypeName` values for catalog integration events (outbox / integration log). */
export const CatalogEmitEventFullNames = {
  ProductPriceChanged:
    'eShop.Catalog.API.IntegrationEvents.Events.ProductPriceChangedIntegrationEvent',
  OrderStockConfirmed:
    'eShop.Catalog.API.IntegrationEvents.Events.OrderStockConfirmedIntegrationEvent',
  OrderStockRejected:
    'eShop.Catalog.API.IntegrationEvents.Events.OrderStockRejectedIntegrationEvent',
} as const;
