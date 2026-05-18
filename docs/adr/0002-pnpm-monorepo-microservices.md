# ADR 0002: pnpm monorepo and microservice layout

## Context

The reference application splits deployable services by bounded context. I need local development where many processes start together, shared libraries for messaging and auth, and a single place to run lint, build, and contract checks.

## Decision

I use a **pnpm workspace** monorepo:

- **`apps/`** — one deployable per context (Nest APIs, workers, BFF, Vite SPAs).
- **`packages/domains/`** — pure domain logic per context.
- **`packages/infrastructure/`** — cross-cutting technical modules (`@eshop/outbox`, `@eshop/auth`, etc.).
- **`contracts/`** — OpenAPI snapshots, gRPC proto, integration-event catalog.

Each backend context is a **separate Nest process** with its own port, env, and (where applicable) database. Root `package.json` scripts orchestrate build order: infrastructure → domains → Nest → web.


