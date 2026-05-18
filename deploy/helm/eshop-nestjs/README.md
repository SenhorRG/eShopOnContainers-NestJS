# Helm chart `eshop-nestjs`

**Docker Compose is the primary local path** in this repository. This chart is a **study-oriented** Kubernetes packaging of all Nest workloads, not a supported production install.

## Workloads

The `services` map in `values.yaml` drives one **Deployment** and **ClusterIP Service** per entry:

| Key | HTTP port | Notes |
|-----|-----------|--------|
| `identity` | 5051 | Prisma DB |
| `catalog` | 5052 | Prisma DB, Redis, RabbitMQ |
| `ordering` | 5053 | Prisma DB, RabbitMQ |
| `basket` | 5054 (+ gRPC 9071) | Redis, RabbitMQ |
| `webhooks` | 5055 | Prisma DB, RabbitMQ |
| `order-grace-worker` | 5065 | Ordering DB, RabbitMQ |
| `payment-worker` | 5066 | Ordering DB, RabbitMQ |
| `mobile-bff` | 5070 | Proxies to identity, catalog, ordering Services |

Disable any row with `services.<key>.enabled: false`.

## External dependencies (default)

This chart **does not** install PostgreSQL, Redis, or RabbitMQ unless you enable optional Bitnami subcharts.

### Option A — managed / self-hosted infra (recommended for study)

Run Postgres, Redis, and RabbitMQ outside the chart (Compose on a dev machine, cloud managed services, or your own operators). Point workloads using:

- Per-service `services.<key>.env` for database URLs and JWT secrets
- `global.rabbitmq` and `global.redis` for shared broker/cache hostnames inside the cluster

Create Kubernetes Secrets before install, for example:

- `identity-db`, `catalog-db`, `ordering-db`, `webhooks-db` with key `databaseUrl` (used by Prisma migrate Jobs)

Or set `prismaMigrate.services.<name>.databaseUrl` inline for dry-run rendering only (never commit real URLs).

### Option B — Bitnami subcharts (optional)

Uncomment the `dependencies` block in `Chart.yaml`, set `postgresql.enabled`, `redis.enabled`, and `rabbitmq.enabled` in `values.yaml`, then:

```bash
helm dependency update deploy/helm/eshop-nestjs
```

Wire `global.rabbitmq.host`, `global.redis.url`, and database URLs to the subchart Service names and credentials from Bitnami chart notes.

## Prisma migrate Jobs

When `prismaMigrate.enabled` is true, Helm renders **post-install/post-upgrade** Jobs for `identity`, `catalog`, `ordering`, and `webhooks`. Each Job runs:

`npx prisma migrate deploy --schema prisma/schema.prisma`

Apply ordering: run infra migrations before traffic, same as `deploy/compose/README-stack.md`.

## Caveats

- **No TLS, quotas, NetworkPolicy, or HPA** — add before shared clusters.
- **Image tags** default to `latest`-style placeholders; pin semver or digests for real use.
- **Study secrets** in Compose examples must not be reused on public endpoints.

## Render and validate

From the monorepo root (`eShopOnContainers-NestJS`):

```bash
helm lint deploy/helm/eshop-nestjs
helm template eshop deploy/helm/eshop-nestjs --debug
helm template eshop deploy/helm/eshop-nestjs -f deploy/helm/eshop-nestjs/values-ingress-study.yaml
```

Service DNS names follow `{release}-{chart}-{serviceKey}` when the release name does not already contain the chart name (e.g. release `eshop` → `eshop-eshop-nestjs-catalog`).

### Optional Ingress (study)

1. Keep `ingress.enabled: false` in `values.yaml` by default.
2. Merge `values-ingress-study.yaml` for a single-host rule to the catalog Service.
3. Add TLS via cert-manager in a real cluster before exposing HTTP.
