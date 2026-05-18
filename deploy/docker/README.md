# Docker images

## Dockerfiles

| File | Role |
|------|------|
| `Dockerfile.nest.template` | Multi-stage build; pass `PNPM_FILTER=@eshop/<package>`. Runtime uses `pnpm deploy --prod` for a slim layer. |
| `Dockerfile.storefront` | Builds `@eshop/storefront-web` with Vite, serves static files with nginx on **8080**. |

Build context is always the **monorepo root** (directory with `package.json` and `pnpm-workspace.yaml`). Honour `.dockerignore`.

The Nest template runs **`pnpm run build:infrastructure && pnpm run build:domains`** before app compile so workspace links resolve. The builder installs **python3, make, g++** on Alpine for native addon postinstalls.

`Dockerfile.storefront` copies `packages/` and runs `build:infrastructure` before the Vite build so `@eshop/ui` resolves.

**Storefront public API origins:** the image accepts build args **`VITE_ESHOP_IDENTITY_ORIGIN`**, **`VITE_ESHOP_CATALOG_ORIGIN`**, **`VITE_ESHOP_ORDERING_ORIGIN`** (defaults `http://127.0.0.1:5051` … `5053`) so the bundled SPA calls APIs on host-published ports — the JavaScript executes in the **browser**, not inside the nginx container. `docker-compose.stack.yml` passes these from `.env.stack` / `.env.stack.example`.

### Example: catalog service

```bash
docker build -f deploy/docker/Dockerfile.nest.template \
  --build-arg PNPM_FILTER=@eshop/catalog-service \
  -t eshop/catalog-service:local .
```

### Basket proto

`contracts/grpc/basket.proto` is copied to **`/proto/basket.proto`** in the image. Compose sets `ESHOP_BASKET_PROTO_PATH=/proto/basket.proto` (overridable in `apps/basket-service`).

## Full stack locally

`deploy/compose/docker-compose.stack.yml` and **`deploy/compose/README-stack.md`**.

## Container scanning (CI)

The `docker-smoke` job builds sample images and runs **Trivy** with **`continue-on-error: true`** so the workflow stays informative without blocking every PR. See `.github/workflows/eshop-nest-ci.yml` and root **`SECURITY.md`**. Flip to strict `exit-code` when you move beyond study use.

## Image size

Targets a small footprint (Alpine + `pnpm deploy`). Staying **under ~250&nbsp;MB** compressed is a best-effort guideline—measure with `docker image inspect` whenever Prisma engines or heavy dependencies move.
