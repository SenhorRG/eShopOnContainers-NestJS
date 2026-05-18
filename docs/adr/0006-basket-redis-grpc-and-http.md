# ADR 0006: Basket — Redis, gRPC, and HTTP

## Context

The reference **Basket.API** stores carts in Redis and exposes **gRPC** with buyer identity from metadata. Other contexts in this repo use HTTP + OpenAPI. The storefront today talks HTTP (directly or via the BFF), not gRPC.

## Decision

For **basket-service** I use:

- **Redis** as the sole store (no Postgres schema).
- **gRPC** on port **9071** with `contracts/grpc/basket.proto`, matching .NET message shapes and JWT-from-metadata identity.
- **HTTP REST + OpenAPI** on port **5054** for browsers and the mobile BFF.

Storefront and mobile clients use **HTTP** for now; gRPC is for learning and parity smoke tests (`grpcurl`). Proto path is resolved via `ESHOP_BASKET_PROTO_PATH` in Docker.

