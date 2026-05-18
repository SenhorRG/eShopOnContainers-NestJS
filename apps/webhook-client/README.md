# `@eshop/webhook-client`

Vite tool for registering webhook subscriptions against **`@eshop/webhooks-service`** using the JSON contract exposed by that API. Login and registration forms use **`@eshop/ui`** (Tailwind tokens in `src/index.css`).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_ESHOP_IDENTITY_ORIGIN` | Identity login API (default `http://127.0.0.1:5051`). |
| `VITE_ESHOP_WEBHOOKS_ORIGIN` | Webhooks HTTP origin (default `http://127.0.0.1:5055`). |
| `VITE_ESHOP_DEV_LOGIN_EMAIL` | Prefill email (fixture user, e.g. `webhooks-dev@eshop.local`). |
| `VITE_WEBHOOK_RECEIVER_ORIGIN` | Demo receiver polled at `GET /api/last` (default `http://127.0.0.1:8788`). |
| `VITE_WEBHOOK_DEFAULT_TOKEN` | Optional static Bearer for quick tests. |

## Local demo receiver

From the monorepo root:

```bash
node scripts/webhook-receiver-demo.mjs
# optional: PORT=9999 node scripts/webhook-receiver-demo.mjs
```

Use destination **`http://127.0.0.1:8788/webhook`** and grant URL **`http://127.0.0.1:8788/grant`**. The script answers **OPTIONS** with the header echo the webhooks API expects.

## Authentication

Send a JWT with `sub`, or enable **`ESHOP_WEBHOOKS_AUTH_BYPASS=true`** on the webhooks service for local-only runs.

## Exposing your machine

Tunnel **8788** (or your chosen port) via **ngrok** or similar when the webhooks service runs where `localhost` means something else:

```bash
ngrok http 8788
```

Keep destination and grant URLs on the **same tunneled host**, different paths allowed.

## Scripts

```bash
pnpm --filter @eshop/webhook-client dev
pnpm --filter @eshop/webhook-client build
```

Project context: **[../../README.md](../../README.md)** · integration events: **[../../contracts/integration-events.md](../../contracts/integration-events.md)** · ADRs: **[../../docs/README.md](../../docs/README.md)**.
