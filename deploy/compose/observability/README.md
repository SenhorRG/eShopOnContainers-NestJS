# Observability stack (Compose, profile `dev`)

OpenTelemetry Collector, Jaeger, Prometheus, Grafana, Loki, Promtail — **local development only**.

Policy notes: [OSS_STACK_POLICY.md](./OSS_STACK_POLICY.md).

**Bundled with local infra:** from the monorepo root, **`pnpm infra:up`** merges this file with `docker-compose.yml` and uses **`deploy/compose/.env.compose.example`** (`COMPOSE_PROFILES=dev`). You do **not** need a second command for Grafana/Jaeger/Prometheus/Loki when following the root getting-started guide.

Equivalent manual command from **`deploy/compose`**:

```bash
docker compose -f docker-compose.yml -f observability/docker-compose.observability.yml --env-file .env.compose.example up -d
```

Containers carry `com.eshop.project=eshop-nestjs` so Promtail can filter them.

| Endpoint | Role |
|----------|------|
| http://localhost:3200 | Grafana (`admin/admin` unless you change it) |
| http://localhost:9099 | Prometheus UI |
| http://localhost:16686 | Jaeger UI |
| http://localhost:3100 | Loki (`/ready`) |
| `localhost:14317` | OTLP gRPC ingest |
| http://localhost:14318 | OTLP HTTP ingest |
| http://localhost:13133 | Collector health |
| http://localhost:8889 | Collector self-metrics scrape |

Operations hub (links + health probes): **`pnpm dev:ui`** includes `operations-dashboard`.

Host-run Nest services: set **`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:14318`** (see root `.env.example`). Services **inside** the same Compose stack should target **`otel-collector:4317`** for gRPC on the Compose network.

Pipelines (simplified): traces → Jaeger; metrics scraped from Collector `:8889`; logs → Promtail → Loki; stdout stays available through Promtail parsing.

### Prometheus (examples)

After traffic exists, browse http://localhost:9099 :

```promql
sum(rate(http_server_duration_milliseconds_count[5m])) by (exported_job)
histogram_quantile(0.95, sum by (le, exported_job) (rate(http_server_duration_milliseconds_bucket{http_status_code="200"}[5m])))
sum(rate(http_server_duration_milliseconds_count{http_status_code=~"5.."}[5m])) by (exported_job)
```

### Loki (examples)

Grafana → Explore → Loki:

```logql
{compose_service="otel-collector"}
{compose_service="catalog-service"} |= "error"
```

### Grafana

Provisioned datasources: Prometheus, Jaeger, Loki. Dashboard folder **eShop Dev** → `eshop-dev-overview.json`.

### Distributed traces through RabbitMQ

`@eshop/event-bus-amqp` forwards W3C trace context on publish and consume; correlate with Jaeger and log `trace_id` fields when present.
