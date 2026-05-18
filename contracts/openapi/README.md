# OpenAPI

Contract policy: [docs/adr/0008-openapi-contract-first.md](../../docs/adr/0008-openapi-contract-first.md).

Snapshots live under **`nest/*.openapi.json`**.

Defaults when exporting via `pnpm contracts:export-openapi`:

| Service | Port | Env override |
|---------|------|----------------|
| identity | 5051 | `OPENAPI_IDENTITY_URL` |
| catalog | 5052 | `OPENAPI_CATALOG_URL` |
| ordering | 5053 | `OPENAPI_ORDERING_URL` |
| basket | 5054 | `OPENAPI_BASKET_URL` |
| webhooks | 5055 | `OPENAPI_WEBHOOKS_URL` |

`mobile-bff.openapi.json` is a **static** gateway contract (no live Swagger). gRPC basket: see `contracts/grpc/README.md`.

Swagger UI: `http://127.0.0.1:<port>/api/docs` (JSON: `/api/docs-json`). Commit regenerated snapshots when the public HTTP surface changes on purpose (`pnpm contracts:export-openapi` with `pnpm dev` running).
