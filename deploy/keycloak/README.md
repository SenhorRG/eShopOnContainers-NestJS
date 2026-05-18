# Keycloak (OIDC study IdP)

Optional OIDC provider for the NestJS monorepo. Auth ADR: [docs/adr/0007-jwt-auth-optional-oidc.md](../../docs/adr/0007-jwt-auth-optional-oidc.md). Use with storefront `VITE_ESHOP_AUTHORITY` and service `ESHOP_JWT_ISSUERS` / `ESHOP_JWT_JWKS_URI` from `@eshop/auth`.

## Start

```bash
docker compose -f deploy/compose/docker-compose.yml -f deploy/keycloak/docker-compose.keycloak.yml up -d --wait
# wait until the realm is ready (repeat curl or use a similar loop in CI)
until curl -fsS http://127.0.0.1:8081/realms/eshop/.well-known/openid-configuration >/dev/null 2>&1; do sleep 2; done
```

Admin console: http://localhost:8081/admin (`admin` / `admin`).

Realm: **eshop** (imported from `realm-eshop.json`).

## Storefront

```bash
# apps/storefront-web/.env.local
VITE_ESHOP_AUTHORITY=http://localhost:8081/realms/eshop
VITE_ESHOP_CLIENT_ID=webapp
```

Disable symmetric auth bypass on ordering when validating Keycloak tokens:

```bash
ESHOP_ORDERING_AUTH_BYPASS=0
ESHOP_JWT_ISSUERS=http://localhost:8081/realms/eshop
ESHOP_JWT_JWKS_URI=http://localhost:8081/realms/eshop/protocol/openid-connect/certs
```

Apply the same JWKS/issuer pair on `webhooks-service` when exercising the webhook-client with Keycloak tokens (`ESHOP_WEBHOOKS_AUTH_BYPASS=0`).

## Playwright OIDC (optional)

Does **not** run in PR CI (`eshop-nest-ci`). Nightly workflow can run specs when dispatched with `run_oidc: true` (see [`.github/workflows/eshop-e2e-nightly.yml`](../../.github/workflows/eshop-e2e-nightly.yml)).

Local:

```bash
# Terminal 1: infra + Keycloak + db:setup + catalog/webhooks with JWKS env
# Terminal 2: storefront with VITE_ESHOP_AUTHORITY, webhook-client preview
pnpm test:e2e:oidc
```

Specs: `tests/e2e/specs/storefront-oidc.spec.ts`, `tests/e2e/specs/webhook-client-oidc.spec.ts` (tag `@oidc`).

| Variable | Default |
|----------|---------|
| `E2E_OIDC_ENABLED` | must be `1` |
| `E2E_KEYCLOAK_ORIGIN` | `http://127.0.0.1:8081` |
| `E2E_OIDC_USER` | `alice@example.com` |
| `E2E_OIDC_PASSWORD` | `Pass123$` |

## Android emulator

Use `http://10.0.2.2:8081/realms/eshop` as issuer when the API runs on the host and the client runs in the emulator.

## Fixture user

- `alice@example.com` / `Pass123$`
