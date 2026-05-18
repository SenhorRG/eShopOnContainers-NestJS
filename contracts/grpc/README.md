# gRPC contracts

Design context: [docs/adr/0006-basket-redis-grpc-and-http.md](../../docs/adr/0006-basket-redis-grpc-and-http.md).

## Basket (`basket.proto`)

| Item | Value |
|------|--------|
| Package | `BasketApi` |
| Service | `Basket` |
| Default port | **9071** (`GRPC_PORT`) |
| Proto path | `contracts/grpc/basket.proto` or `ESHOP_BASKET_PROTO_PATH` |

### RPCs

| RPC | Request | Response |
|-----|---------|----------|
| `GetBasket` | `GetBasketRequest` (empty) | `CustomerBasketResponse` |
| `UpdateBasket` | `UpdateBasketRequest` | `CustomerBasketResponse` |
| `DeleteBasket` | `DeleteBasketRequest` | `DeleteBasketResponse` |

Buyer identity is taken from gRPC metadata (JWT), not from the request body — parity with **Basket.API** (.NET).

### Server wiring

`apps/basket-service` loads the proto via `resolveBasketProtoPath()` in `main.ts` and exposes Nest `Transport.GRPC` alongside HTTP OpenAPI on port **5054**.

### Clients

| Client | Status |
|--------|--------|
| Storefront / mobile | **future** — use HTTP via `mobile-bff` `/api/basket` or direct `basket-service` REST |
| Generated TS (`ts-proto`) | **future** |
| `grpcurl` reflection | **not enabled** — use proto file + port 9071 |

### Example (grpcurl)

```bash
grpcurl -plaintext -import-path contracts/grpc -proto basket.proto localhost:9071 list
```

### .NET parity notes

Field numbers in `BasketItem` follow the upstream proto (`product_id` = 2, `quantity` = 6). Keep `keepCase: true` in the Nest loader when evolving messages.

### Buf (optional CI)

[Buf](https://buf.build) can lint and detect breaking proto changes before merge. This repo keeps a **hand-maintained** `basket.proto`; Buf is optional for study.

Minimal `buf.yaml` at repo root (create when enabling CI):

```yaml
version: v2
modules:
  - path: contracts/grpc
lint:
  use:
    - STANDARD
breaking:
  use:
    - FILE
```

Example local commands:

```bash
buf lint contracts/grpc
buf breaking --against ".git#branch=main,subdir=contracts/grpc"
```

Wire a GitHub Actions step only when `buf` is added to the toolchain; until then, rely on code review + `grpcurl` smoke tests documented above.
