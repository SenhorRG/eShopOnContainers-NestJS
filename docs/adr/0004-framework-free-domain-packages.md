# ADR 0004: Framework-free domain packages

## Context

Nest and Prisma encourage putting everything in `apps/*/src`. If domain rules import `@nestjs/common` or Prisma clients, unit tests need heavy bootstrapping and bounded contexts leak infrastructure into the core model.

## Decision

I extract **pure domain packages** under `packages/domains/` (`@eshop/ordering-domain`, `@eshop/catalog-domain`, etc.) with a strict dependency rule:

```text
apps/*  →  packages/infrastructure/*  →  (no domains)
apps/*  →  packages/domains/*            →  (stdlib only)
packages/domains/*  →  MUST NOT import @nestjs/*, apps/*, or packages/infrastructure/*
packages/infrastructure/*  →  MUST NOT import packages/domains/*
```

Nest services map between DTOs/Prisma models and domain types in the **application** layer. Inside each service, `src/` splits into **api**, **application**, **infrastructure**, and **integration**.


