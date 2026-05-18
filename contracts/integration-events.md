# Integration events

Architecture: [docs/adr/0005-transactional-outbox-rabbitmq-integration.md](../docs/adr/0005-transactional-outbox-rabbitmq-integration.md).

**RabbitMQ routing key:** short type name (same convention as the reference sample, for example `OrderStartedIntegrationEvent`), not a namespace-qualified string.

**Sample payloads (`golden/`):** property names remain **PascalCase** so fixtures stay readable next to dotnet samples. Apps may camelCase internally; AMQP payloads must satisfy consumer expectations documented per service.

## Ordering-related events

| Routing key | Role |
|-------------|------|
| `OrderStartedIntegrationEvent` | Checkout started; clears basket coupling |
| `OrderStockConfirmedIntegrationEvent` | Successful stock reservation |
| `OrderStockRejectedIntegrationEvent` | Stock reservation failed |
| `OrderStatusChangedToAwaitingValidationIntegrationEvent` | Waiting on catalog validation |
| `OrderStatusChangedToSubmittedIntegrationEvent` | Submitted |
| `OrderStatusChangedToStockConfirmedIntegrationEvent` | Stock confirmed (bridge toward payment) |
| `OrderStatusChangedToPaidIntegrationEvent` | Paid |
| `OrderStatusChangedToShippedIntegrationEvent` | Shipped |
| `OrderStatusChangedToCancelledIntegrationEvent` | Cancelled |
| `OrderPaymentSucceededIntegrationEvent` / `OrderPaymentFailedIntegrationEvent` | Payment outcomes |
| `GracePeriodConfirmedIntegrationEvent` | Grace window closed |
| `ProductPriceChangedIntegrationEvent` | Catalog price broadcast |

Service-specific modules choose which events they publish or subscribe to.

## Publisher / consumer matrix

| Routing key | Publisher | Consumer |
|-------------|-----------|----------|
| `OrderStartedIntegrationEvent` | `ordering-service` | `basket-service` |
| `OrderStatusChangedToSubmittedIntegrationEvent` | `ordering-service` | — |
| `OrderStatusChangedToAwaitingValidationIntegrationEvent` | `ordering-service` | `catalog-service` |
| `OrderStockConfirmedIntegrationEvent` | `catalog-service` | `ordering-service` |
| `OrderStockRejectedIntegrationEvent` | `catalog-service` | `ordering-service` |
| `OrderStatusChangedToStockConfirmedIntegrationEvent` | `ordering-service` | `payment-worker` |
| `OrderPaymentSucceededIntegrationEvent` / `OrderPaymentFailedIntegrationEvent` | `payment-worker` | `ordering-service` |
| `OrderStatusChangedToPaidIntegrationEvent` | `ordering-service` | `catalog-service`, `webhooks-service` |
| `OrderStatusChangedToShippedIntegrationEvent` | `ordering-service` | `webhooks-service` |
| `OrderStatusChangedToCancelledIntegrationEvent` | `ordering-service` | — |
| `ProductPriceChangedIntegrationEvent` | `catalog-service` | `webhooks-service` |
| `GracePeriodConfirmedIntegrationEvent` | `order-grace-worker` | `ordering-service` |

Outbox rows may store a longer persisted type name; AMQP publication still keys off the short name via `@eshop/outbox`.
