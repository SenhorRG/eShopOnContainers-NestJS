# `packages/domains`

Pure domain logic without Nest, Prisma, or HTTP imports.

| Package | Name |
|---------|------|
| `ordering/` | `@eshop/ordering-domain` |
| `catalog/` | `@eshop/catalog-domain` |
| `basket/` | `@eshop/basket-domain` |
| `identity/` | `@eshop/identity-domain` |

## Allowed dependency graph

```text
apps/*  →  packages/infrastructure/*  →  (no domains)
apps/*  →  packages/domains/*          →  (stdlib only)
packages/domains/*  →  MUST NOT import @nestjs/*, apps/*, or packages/infrastructure/*
packages/infrastructure/*  →  MUST NOT import packages/domains/*
```

Domains stay framework-free so they can be unit-tested without bootstrapping Nest.

Rationale: [docs/adr/0004-framework-free-domain-packages.md](../../docs/adr/0004-framework-free-domain-packages.md).
