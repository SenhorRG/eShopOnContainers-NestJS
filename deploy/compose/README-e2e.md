# Compose profile `e2e`

Paths are relative to **`deploy/compose/`**.

Infrastructure services attach the **`e2e`** profile in `docker-compose.yml`.

```bash
COMPOSE_PROFILES=e2e docker compose -f docker-compose.yml --env-file .env.compose.example up -d
```

Before `pnpm test:e2e`, start Nest apps and the storefront (see `tests/e2e/README.md`). Journey specs **auto-skip** when origins are down; set **`E2E_RUN_CHECKOUT=1`** for the ordering draft API test.

Optional: **`E2E_RUN_HEALTH=1`** for `/api/alive` probes only.
