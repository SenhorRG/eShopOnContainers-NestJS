# Documentation

Architecture notes and decision records for **eShopOnContainers-NestJS**. Operational guides (Compose, Helm, E2E, contracts) stay next to the code they describe; this folder holds **why** the system is shaped the way it is.

## Architecture overview

System diagrams, bounded contexts, and pattern summaries live in the root [README.md](../README.md) (sections *Design patterns and architecture concepts* and *Diagrams*). I keep runbooks and wire formats in their owning folders ([deploy/](../deploy/), [contracts/](../contracts/), [tests/](../tests/)).

## Architecture Decision Records (ADRs)

| ADR | Topic |
|-----|--------|
| [0001](adr/0001-nestjs-typescript-study-reimplementation.md) | NestJS / TypeScript study reimplementation |
| [0002](adr/0002-pnpm-monorepo-microservices.md) | pnpm monorepo and microservice layout |
| [0003](adr/0003-database-per-service-prisma.md) | Database per service with Prisma |
| [0004](adr/0004-framework-free-domain-packages.md) | Framework-free domain packages |
| [0005](adr/0005-transactional-outbox-rabbitmq-integration.md) | Transactional outbox and RabbitMQ integration |
| [0006](adr/0006-basket-redis-grpc-and-http.md) | Basket: Redis, gRPC, and HTTP |
| [0007](adr/0007-jwt-auth-optional-oidc.md) | JWT auth and optional OIDC |
| [0008](adr/0008-openapi-contract-first.md) | OpenAPI contract-first HTTP APIs |
| [0009](adr/0009-mobile-bff-http-proxy.md) | Mobile BFF as HTTP reverse proxy |

Full index: [adr/README.md](adr/README.md).

## Related docs (outside `docs/`)

| Topic | Location |
|-------|----------|
| Integration events matrix | [contracts/integration-events.md](../contracts/integration-events.md) |
| Security posture | [SECURITY.md](../SECURITY.md) |
| Local Compose / stack | [deploy/compose/README.md](../deploy/compose/README.md) |
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) |
