# `@eshop/operations-dashboard`

Local **operations hub** (Vite SPA, dev port **5188**). Polls Nest service health URLs and links to Grafana, Prometheus, Loki, and Jaeger when `pnpm infra:up` is running.

## Environment

Copy `apps/operations-dashboard/.env.example` to the monorepo root `.env` or set `VITE_ESHOP_*` URLs for observability consoles.

Optional `VITE_ESHOP_OPS_SERVICES_JSON` overrides the default service list in `src/features/catalog/local-nest-services.json` (includes **mobile-bff** on **5070** and **basket-service** on **5054**).

## Scripts

```bash
pnpm --filter @eshop/operations-dashboard dev
pnpm --filter @eshop/operations-dashboard test
pnpm --filter @eshop/operations-dashboard build
```

Run with backends via `pnpm dev` and `pnpm dev:ui`.
