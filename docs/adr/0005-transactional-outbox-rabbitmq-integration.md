# ADR 0005: Transactional outbox and RabbitMQ integration

## Context

When ordering or catalog commits to Postgres, other services (basket, payment worker, webhooks) must react reliably. Publishing to RabbitMQ inside the same request without durability risks lost messages if the broker is down or the process crashes after commit.

## Decision

I use:

1. **Transactional outbox** — integration events are inserted in the **same database transaction** as domain writes (`@eshop/outbox`, `appendToOutbox` in catalog/ordering integration services).
2. **Post-commit publish** — after `prisma.$transaction` succeeds, pending outbox rows for that `transactionId` are published to RabbitMQ in order.
3. **RabbitMQ + AMQP** — routing keys follow the **short event type name** (aligned with the reference eShop vocabulary). Shared types live in `@eshop/integration-event-types`.
4. **Inbox / idempotency** — consumers that must survive redelivery use `@eshop/inbox` and `@eshop/idempotency` (e.g. webhooks ledger, ordering command `requestId` deduplication).

Order lifecycle is **event-driven choreography** (grace worker, payment worker, catalog stock validation)—not a central orchestrator service.

Event matrix: [contracts/integration-events.md](../../contracts/integration-events.md).

