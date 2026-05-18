# Docker Compose (`deploy/compose/`)

All paths below are relative to **this directory**.

## Project labels

- `com.eshop.project=eshop-nestjs`, `com.eshop.stack=nestjs-monorepo`, `com.eshop.orchestrator=docker-compose`  
- Compose project name: **`eshop-nestjs`** (`name:` in `docker-compose.yml`, mirrored in `.env.compose.example`).

## Profiles (summary)

| Profile | Typical `COMPOSE_PROFILES` | Purpose |
|---------|---------------------------|--------|
| `dev` | `dev` (default in `.env.compose.example`) + merge **`observability/docker-compose.observability.yml`** via **`pnpm infra:up`** | PostgreSQL, Redis, RabbitMQ, OTLP collector, Prometheus, Grafana, Jaeger, Loki |
| `e2e` | `e2e` (override when running compose; see [README-e2e.md](./README-e2e.md)) | Infra dependencies for automated tests |
| `stack` | `stack` plus `docker-compose.stack.yml` | Infra plus locally built service images |

## Published ports (host)

| Service | Ports |
|---------|-------|
| PostgreSQL | **55432** → 5432 |
| Redis | **56379** → 6379 |
| RabbitMQ AMQP / management UI | **55672** / **55673** |
| Grafana / Prometheus (dev merge) | **3200** / **9099** |
| OTLP gRPC / HTTP | **14317** / **14318** |

Databases created by init scripts: `catalogdb`, `identitydb`, `orderingdb`, `webhooksdb`.

## Related docs

| File | Use when |
|------|----------|
| [README-stack.md](./README-stack.md) | Running the full Docker stack profile |
| [README-ci.md](./README-ci.md) | CI merge file and `.env.ci.example` |
| [README-e2e.md](./README-e2e.md) | Playwright dependency profile |
| [observability/README.md](./observability/README.md) | Grafana, Prometheus, Jaeger, Loki |
| [initdb/README.md](./initdb/README.md) | SQL bootstrap order |

End-to-end project context: **[../../README.md](../../README.md)** · architecture ADRs: **[../../docs/README.md](../../docs/README.md)**.

## Bring infrastructure up

From the repository root:

```bash
pnpm infra:up
```

## HTTP endpoints in CI

Use `ESHOP_USE_HTTP_ENDPOINTS=1` when jobs expect plain `http://` URLs (see `.env.ci.example`).

## Overrides

Copy `compose.override.example.yml` to `compose.override.yml` beside this file for local-only tweaks.
