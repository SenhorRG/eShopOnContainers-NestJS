# ADR 0008: OpenAPI contract-first HTTP APIs

## Context

Multiple Nest services and three Vite apps consume HTTP APIs. Undocumented drift between services and frontends breaks CI and study comparisons with the reference solution.

## Decision

I treat **OpenAPI** as the contract for HTTP:

- Each Nest HTTP service exposes Swagger at `/api/docs` and JSON at `/api/docs-json`.
- Committed snapshots live under **`contracts/openapi/nest/*.openapi.json`**.
- Root scripts: `pnpm contracts:export-openapi` (regenerate) and `pnpm contracts:check` (CI gate against committed files).
- **mobile-bff** ships a **static** OpenAPI document (gateway contract, not live-generated from downstream services).

gRPC basket schema is separate under `contracts/grpc/` ([ADR 0006](0006-basket-redis-grpc-and-http.md)).

