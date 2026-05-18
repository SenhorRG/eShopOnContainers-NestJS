# OSS observability stack policy

Local telemetry uses OSS components runnable on self-hosted infrastructure, without requiring commercial SaaS tiers on the critical path.

## Stack

| Layer | Component |
|-------|-----------|
| SDK | OpenTelemetry Node SDK (`@eshop/observability`) |
| Agent | OpenTelemetry Collector contrib |
| Traces | Jaeger all-in-one (dev) |
| Metrics | Prometheus |
| Visualization | Grafana |
| Logs | Loki + Promtail |

Pinned image tags live in `docker-compose.observability.yml`. Bump versions deliberately and validate collector health and Jaeger UI after upgrades.

## Excluded from mandatory path

Paid observability backends as **hard** prerequisites for local development.
