# ADR 0003: Database per service with Prisma

## Context

eShop’s contexts (identity, catalog, ordering, webhooks) own different aggregates and should evolve schemas independently. I also want type-safe data access and migrations without hand-writing SQL for every change.

## Decision

I apply **database per service** on a single PostgreSQL instance for local study:

| Service | Database (typical) | ORM |
|---------|-------------------|-----|
| identity-service | `identity` | Prisma (schema under `apps/identity-service`) |
| catalog-service | `catalog` | Prisma + optional pgvector |
| ordering-service | `ordering` | Prisma |
| webhooks-service | `webhooks` | Prisma |
| basket-service | — | **Redis** only (no Postgres) |

Each service runs **`prisma migrate`** against its own `DATABASE_URL`. Seeds and fixtures live beside that app’s Prisma folder. I do **not** share one Prisma schema across services.

