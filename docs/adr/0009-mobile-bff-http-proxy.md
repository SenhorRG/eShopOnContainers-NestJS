# ADR 0009: Mobile BFF as HTTP reverse proxy

## Context

Mobile or aggregated clients in the reference solution use a **backend-for-frontend** to reduce chatty calls and hide internal service URLs. I do not need GraphQL or custom aggregation logic yet—only a stable edge for catalog, ordering, basket, and identity.

## Decision

**mobile-bff** is a thin Nest app that:

- Registers **HTTP reverse proxy routes** to downstream services (`MobileBffProxyService`, registered before `listen` so body parsing stays correct).
- Exposes a **static OpenAPI** document describing the gateway surface.
- Does **not** own business data or a database.

Clients call the BFF origin; the BFF forwards to identity, catalog, ordering, and basket HTTP ports. This mirrors the “gateway aggregation” study goal without duplicating domain logic.
