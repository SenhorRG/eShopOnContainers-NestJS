# Compose profile `stack` (full Docker stack)

Paths are relative to **`deploy/compose/`** unless noted.

For prerequisites, migrations from the host, and health checks, see the **[root README.md](../../README.md)**.

Runs PostgreSQL (pgvector), Redis, and RabbitMQ from `docker-compose.yml`, then builds and runs **all Nest backends that match `pnpm dev`** (including **identity-service**), **mobile-bff**, and the **storefront** nginx image (see `docker-compose.stack.yml`). **`webhook-client`** and **`operations-dashboard`** are intentionally **not** baked into this profile: use **`pnpm dev:ui`** on the host for those SPAs (avoids extra nginx routing / `VITE_BASE` complexity in Compose). Revisit only if you explicitly want an “ops hub only from Docker” demo.

## Prerequisites

- Docker with Compose v2  
- Dependencies installed on the host if you apply **Prisma `migrate deploy`** against the published Postgres port before traffic  
- Repo root: **`pnpm install`** so `pnpm db:migrate` / `pnpm db:seed` can run

## pnpm wrappers (repo root)

| Script | Purpose |
|--------|---------|
| `pnpm stack:up` | Build (if needed) and start all **`stack`** profile services. |
| `pnpm stack:down` | Stop and remove stack containers for this compose project. |

**Typical first-time flow:** ensure Postgres is reachable on **`127.0.0.1:55432`** (e.g. `pnpm infra:up` or stack-only DB), run **`pnpm db:migrate`** and **`pnpm db:seed`** from the repo root with **`.env`** pointing at that Postgres, then **`pnpm stack:up`**. Verify with **`curl -sf http://127.0.0.1:5051/api/alive`** and **`curl -sf http://127.0.0.1:8080/health`**.

## Start the stack (manual compose)

```bash
cd deploy/compose
cp .env.stack.example .env.stack
docker compose -f docker-compose.yml -f docker-compose.stack.yml --env-file .env.stack --profile stack up -d --build
```

### One-time migrations (empty Postgres volume)

Point each Prisma datasource at **`127.0.0.1:55432`** and run deploy from the repo root. Example (**PowerShell**):

```powershell
$env:ESHOP_CATALOG_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:55432/catalogdb"
pnpm --filter @eshop/catalog-service exec prisma migrate deploy --schema prisma/schema.prisma

$env:ESHOP_IDENTITY_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:55432/identitydb"
pnpm --filter @eshop/identity-service exec prisma migrate deploy --schema prisma/schema.prisma

$env:ESHOP_ORDERING_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:55432/orderingdb"
pnpm --filter @eshop/ordering-service exec prisma migrate deploy --schema prisma/schema.prisma

$env:ESHOP_WEBHOOKS_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:55432/webhooksdb"
pnpm --filter @eshop/webhooks-service exec prisma migrate deploy --schema prisma/schema.prisma
```

On Unix shells, replace with `export VAR=value`.

## Published ports (host)

| Surface | Port |
|---------|------|
| Storefront (nginx, static build) | 8080 |
| Identity | 5051 |
| Catalog | 5052 |
| Ordering | 5053 |
| Basket HTTP / gRPC | 5054 / 9071 |
| Webhooks | 5055 |
| Order grace worker | 5065 |
| Payment worker | 5066 |
| Mobile BFF | 5070 |
| Postgres | 55432 |
| Redis | 56379 |
| RabbitMQ AMQP / UI | 55672 / 55673 |

## Health URLs

Nest apps expose Terminus probes (paths vary: many HTTP apps use **`/api/alive`** behind a global prefix; some workers use **`/alive`**). The storefront image answers **`/health`** on port 8080.

After **`pnpm stack:up`**, probe manually, e.g. **`curl -sf http://127.0.0.1:5051/api/alive`** (identity). **`mobile-bff`** (**5070**) proxies **`/identity`** to **`identity-service`** when **`ESHOP_BFF_PROXY_IDENTITY_ENABLED`** is true in `.env.stack`.
