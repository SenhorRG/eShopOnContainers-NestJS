# `@eshop/identity-service`

Study **identity** API: local account login/register and HS256 **Bearer** tokens for SPAs and services. Optional **Keycloak** OIDC is documented under `deploy/keycloak/`; downstream APIs accept Keycloak tokens when `ESHOP_JWT_JWKS_URI` and `ESHOP_JWT_ISSUERS` are set (`@eshop/auth`).

## Ports

| Protocol | Default |
|----------|---------|
| HTTP | `5051` (`PORT`) |
| Swagger UI | `http://127.0.0.1:5051/api/docs` (with `pnpm dev`) |

## Environment

| Variable | Purpose |
|----------|---------|
| `ESHOP_IDENTITY_DATABASE_URL` | Postgres (`identitydb`) |
| `ESHOP_IDENTITY_ISSUER_URL` | `iss` claim on symmetric tokens (default `http://localhost:5051`) |
| `ESHOP_JWT_SYMMETRIC_SECRET` | HS256 signing for tokens issued by this service |
| `ESHOP_JWT_EXPIRES_SECONDS` | Access token lifetime (default `3600`) |
| `ESHOP_SEED_USER_PASSWORD` | Password for fixture users (`prisma:seed:identity`) |

OIDC validation happens on **consumers** (basket, ordering, webhooks), not in this service:

| Variable | Purpose |
|----------|---------|
| `ESHOP_JWT_JWKS_URI` | Keycloak JWKS URL → RS256 validation |
| `ESHOP_JWT_ISSUERS` | Allowed `iss` values (comma/semicolon list) |
| `ESHOP_JWT_AUDIENCE` | Optional audience when `ESHOP_JWT_VALIDATE_AUDIENCE=true` |

## Keycloak study path

1. Start Keycloak: see `deploy/keycloak/README.md`.
2. Storefront `apps/storefront-web/.env.local`:
   - `VITE_ESHOP_AUTHORITY=http://localhost:8081/realms/eshop`
   - `VITE_ESHOP_CLIENT_ID=webapp`
   - `VITE_ESHOP_BFF_ORIGIN=http://127.0.0.1:5070`
3. Services `.env`: `ESHOP_JWT_JWKS_URI`, `ESHOP_JWT_ISSUERS`, `ESHOP_ORDERING_AUTH_BYPASS=0`.
4. Login as `alice@example.com` / `Pass123$` (realm import).

Symmetric identity login remains available for webhook-client and lab flows when OIDC env vars are unset on the SPA.

## Scripts

```bash
pnpm --filter @eshop/identity-service dev
pnpm --filter @eshop/identity-service prisma:migrate
pnpm --filter @eshop/identity-service prisma:seed:identity
```

Monorepo context: **[../../README.md](../../README.md)** · ADRs: **[../../docs/README.md](../../docs/README.md)**.
