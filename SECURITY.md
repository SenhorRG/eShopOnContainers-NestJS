# Security

This repository is a study sample. There is **no bug bounty**, **no SLA**, and **no implied production warranty**.

## Reporting

- Prefer **GitHub private security advisories** when enabled.  
- Otherwise open an issue with title prefix `[SECURITY]` and **do not** post full exploit chains or live credentials in public comments.  

## Expectations

- Committed templates contain **fake dev-only** secrets. Replace all of them before exposing any environment.  
- Do not commit `.env`, connection strings, JWT signing material, or webhook signing keys.  
- CI may run **Trivy** image scans in a non-blocking mode so logs stay informative; see `deploy/docker/README.md` and `.github/workflows/eshop-nest-ci.yml`. Treat output as guidance until you tighten `exit-code` for real deployments.  

## Sensitive data in source (policy)

| Allowed | Not allowed in application/library `src` |
|--------|------------------------------------------|
| `apps/*/prisma/fixtures/**` — fake users, dev default password JSON, login aliases | Hardcoded passwords, API keys, JWT secrets |
| `apps/*/prisma/seed.ts` — reads fixtures + `ESHOP_SEED_USER_PASSWORD` | Default connection strings with credentials in Nest `app.module.ts` |
| Root `.env.example`, `deploy/compose/*.example` — local templates (gitignored `.env` at runtime) | `VITE_*` variables that embed passwords (bundled into the browser) |
| `tests/**` — ephemeral Testcontainers credentials for CI only | Real production emails/passwords in comments or UI |

JWT signing material is resolved **only** from `ESHOP_JWT_SYMMETRIC_SECRET` / service-specific env keys (`@eshop/auth`); there is no literal fallback in TypeScript source.

## Audit snapshot (maintainer checklist)

Re-run before releases:

```bash
# Passwords / common dev leaks in TS/TSX (exclude seeds, dist, node_modules)
rg -i "Pass123|postgres:postgres|eshop-local-jwt|webhooks-dev-secret" --glob "*.ts" --glob "!**/dist/**" --glob "!**/node_modules/**"
```

Last review: **webhook-client** login uses identity API (no JWT paste); dev user `webhooks-dev@eshop.local` lives only in identity fixtures; default seed password moved to `fixtures/seed-dev-defaults.json`; Nest health modules require `ESHOP_*_DATABASE_URL` from `.env`.
