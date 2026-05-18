# ADR 0007: JWT auth and optional OIDC


## Context

Identity must issue tokens for the storefront and propagate buyer identity to basket, ordering, and BFF routes. Local study runs should work without standing up an IdP. Production-like OIDC is still worth exploring in this repo.

## Decision

I standardize on **`@eshop/auth`** with:

- **Default:** symmetric JWT from **identity-service** (`ESHOP_JWT_SYMMETRIC_SECRET`), Passport JWT guards on protected routes.
- **Study bypass flags** (e.g. `ESHOP_ORDERING_AUTH_BYPASS`) — intentional for local labs; documented in [SECURITY.md](../../SECURITY.md).
- **Optional OIDC:** Keycloak realm for issuer/JWKS validation (`ESHOP_JWT_ISSUERS`, `ESHOP_JWT_JWKS_URI`) when bypass is disabled.

Secrets never ship as literals in `src`; they come from env only. The storefront may decode JWT payload for display without verifying (UX only).


