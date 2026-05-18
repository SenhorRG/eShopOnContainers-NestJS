# Contracts

Contracts and wire samples for HTTP, gRPC, and integration messaging. Why we commit snapshots and separate gRPC: [docs/adr/0008-openapi-contract-first.md](../docs/adr/0008-openapi-contract-first.md), [docs/adr/0006-basket-redis-grpc-and-http.md](../docs/adr/0006-basket-redis-grpc-and-http.md).

## Layout

| Path | Purpose |
|------|---------|
| `grpc/basket.proto` | Basket gRPC schema (used by `basket-service` and clients). See **`grpc/README.md`**. |
| `openapi/nest/*.openapi.json` | OpenAPI exports for Nest HTTP apps. |
| `golden/*.json` | Example integration-event payloads (PascalCase field names on the wire). |
| `integration-events.md` | Routing keys, publisher/consumer matrix. |

## gRPC

Keep `package`, `service`, and message identifiers stable: generated code and loaders depend on exact names.

## OpenAPI snapshots

Refresh from running apps (`GET /api/docs-json` per service, or `pnpm contracts:export-openapi`) when you change HTTP contracts, then commit the JSON. See `openapi/README.md`.

## Integration events

RabbitMQ routing keys use the **short event type name** (see `integration-events.md` and **`@eshop/outbox`** behaviour in services).
