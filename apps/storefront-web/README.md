# `@eshop/storefront-web`

Vite + React storefront. Dev server defaults to **`http://127.0.0.1:5173`**. Shares **`@eshop/ui`** primitives with the webhook client.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_ESHOP_CATALOG_ORIGIN` | Catalog HTTP origin (no trailing slash). Typical dev default: `http://127.0.0.1:5052`. |
| `VITE_ESHOP_ORDERING_ORIGIN` | Ordering HTTP origin. Typical dev default: `http://127.0.0.1:5053`. |
| `VITE_ESHOP_IDENTITY_ORIGIN` | Identity login API. Typical dev default: `http://127.0.0.1:5051`. |
| `VITE_ESHOP_BFF_ORIGIN` | Mobile BFF for basket REST (`/api/basket`). Typical dev default: `http://127.0.0.1:5070`. |
| `VITE_ESHOP_AUTHORITY` | Optional OIDC authority (Keycloak realm URL). When set, login uses `oidc-client-ts`. |
| `VITE_ESHOP_CLIENT_ID` | OIDC public client id (default `webapp`). |
| `VITE_ESHOP_CART_GUEST_MODE` | When `true`, keeps cart in sessionStorage even when logged in. |

See `apps/storefront-web/.env.example` for a full template.

## HTTP usage in this SPA

- Catalog list: `GET /api/catalog/items?api-version=1.0` (`src/lib/catalog-api.ts`).  
- Catalog picture: `GET /api/catalog/items/{id}/pic?api-version=1.0`.  
- Ordering: REST under **`/api/v1/orders`** (draft create, lists, detail).  

## Basket

When the user is authenticated and `VITE_ESHOP_CART_GUEST_MODE` is not enabled, the cart syncs with **basket-service** via **mobile-bff**:

- `GET|PUT|DELETE` `{VITE_ESHOP_BFF_ORIGIN}/api/basket` with `Authorization: Bearer <token>`
- Implementation: `src/lib/basket-api.ts`, `src/features/cart/use-cart-basket-sync.ts`

Guests (or guest mode) keep cart lines in **sessionStorage** only.

## Assets

Public layout assets live under **`public/images/`** and **`public/icons/`**. Catalogue **product** images are hosted by **`catalog-service`** (`apps/catalog-service/assets/pics`), not duplicated under `public/`.

Monorepo setup and ports: **[../../README.md](../../README.md)** · docs: **[../../docs/README.md](../../docs/README.md)**.

## Scripts

```bash
pnpm --filter @eshop/storefront-web dev
pnpm --filter @eshop/storefront-web build
```

Ensure workspace packages compile when consuming published `dist` outputs (`pnpm build:infrastructure` from the root); Vite can also transpile **`@eshop/ui`** from source via workspace links depending on tsconfig paths.
