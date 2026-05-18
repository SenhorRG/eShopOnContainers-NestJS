# `@eshop/e2e-tests` (Playwright)

## Default command (`pnpm test:e2e`)

Runs **Chromium** specs. Optional suites **probe live services** and **skip with a clear message** when the stack is down so CI stays green without a full Compose profile.

| Suite | When it runs |
|-------|----------------|
| Harness smoke | Always (`workspace.spec.ts`) |
| Storefront journey (catalog, JWT login, cart) | When storefront, identity, and catalog `/api/alive` respond |
| Checkout draft (`POST /api/orders/draft`) | When `E2E_RUN_CHECKOUT=1` and ordering is up |
| Nest HTTP health | `E2E_RUN_HEALTH=1` |
| Storefront screenshots | `E2E_RUN_VISUAL=1` and reachable `E2E_STOREFRONT_ORIGIN` |
| Storefront axe | `E2E_RUN_A11Y=1` and the same storefront origin |

### Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_STOREFRONT_ORIGIN` | `http://127.0.0.1:5173` | Vite storefront |
| `E2E_IDENTITY_ORIGIN` | `http://127.0.0.1:5051` | JWT login API |
| `E2E_CATALOG_ORIGIN` | `http://127.0.0.1:5052` | Catalog API |
| `E2E_ORDERING_ORIGIN` | `http://127.0.0.1:5053` | Ordering API |
| `E2E_IDENTITY_USER` | `alice` | Seed user (alias → email) |
| `E2E_IDENTITY_PASSWORD` | `Pass123$` | Seed password |
| `E2E_RUN_CHECKOUT` | off | Enable draft-order API test |
| `E2E_OIDC_ENABLED` | off | Run `@oidc` specs (Keycloak + JWKS on APIs) |
| `E2E_KEYCLOAK_ORIGIN` | `http://127.0.0.1:8081` | Keycloak base URL |
| `E2E_OIDC_USER` / `E2E_OIDC_PASSWORD` | `alice@example.com` / `Pass123$` | Keycloak fixture user |

Canonical OIDC command: `pnpm test:e2e:oidc` (see `deploy/keycloak/README.md`).

Example full local journey:

```bash
pnpm infra:up && pnpm db:setup
pnpm dev   # identity, catalog, ordering, …
pnpm --filter @eshop/storefront-web dev   # :5173
pnpm test:e2e
E2E_RUN_CHECKOUT=1 pnpm test:e2e
```

## Visual baselines

```bash
pnpm --filter @eshop/storefront-web run build
pnpm --filter @eshop/storefront-web exec vite preview --host 127.0.0.1 --port 5173 --strictPort
# separate shell:
pnpm --filter @eshop/e2e-tests run test:visual:update
pnpm --filter @eshop/e2e-tests run test:visual
pnpm --filter @eshop/e2e-tests run test:a11y
```

Snapshots live under `specs/storefront-visual.spec.ts-snapshots/` with a **platform suffix** (for example `-chromium-win32.png`). Use workflow **`eshop-storefront-visual-snapshots`** (`workflow_dispatch` in `.github/workflows/`) to refresh Linux PNGs consumed in CI.

## Cross-browser (optional)

```bash
E2E_CROSS_BROWSER=1 pnpm exec playwright test
```

## Accessibility exceptions

Documented waivers live in **`A11Y_WAIVERS.md`** (temporary `color-contrast` suppression on catalog filter headings).
