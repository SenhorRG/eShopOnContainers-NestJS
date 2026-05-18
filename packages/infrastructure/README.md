# `packages/infrastructure`

Shared technical building blocks for Nest apps and Vite frontends.

| Directory | Package name |
|-----------|--------------|
| `auth` | `@eshop/auth` |
| `event-bus-amqp` | `@eshop/event-bus-amqp` |
| `outbox` | `@eshop/outbox` |
| `observability` | `@eshop/observability` |
| `health` | `@eshop/health` |
| `http-resilience` | `@eshop/http-resilience` |
| `integration-event-types` | `@eshop/integration-event-types` |
| `openapi-common` | `@eshop/openapi-common` |
| `shared-exception-filters` | `@eshop/shared-exception-filters` |
| `ui` | `@eshop/ui` |
| `inbox` | `@eshop/inbox` |
| `idempotency` | `@eshop/idempotency` |

**Rule:** infrastructure packages must not import `apps/*` or `packages/domains/*`.

Domain packages live under `packages/domains/` — see `packages/domains/README.md` for the allowed dependency graph. Layering decisions: [docs/adr/0004-framework-free-domain-packages.md](../../docs/adr/0004-framework-free-domain-packages.md), [docs/adr/0005-transactional-outbox-rabbitmq-integration.md](../../docs/adr/0005-transactional-outbox-rabbitmq-integration.md).
