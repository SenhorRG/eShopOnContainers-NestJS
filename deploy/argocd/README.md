# Argo CD GitOps study path

This folder holds **declarative Application manifests** that sync the Helm chart at `deploy/helm/eshop-nestjs`. It is for learning GitOps flow, not production operations.

## Prerequisites

- A Kubernetes cluster and [Argo CD](https://argo-cd.readthedocs.io/) installed (namespace `argocd` is common).
- Container images built and pushed to a registry your cluster can pull (see `deploy/docker/Dockerfile.nest.template`).
- Database Secrets (or external managed Postgres) before enabling `prismaMigrate` hooks.

## Layout

| File | Purpose |
|------|---------|
| `app-of-apps.yaml` | Root Application that syncs child apps from `deploy/argocd/applications/` |
| `applications/eshop-nestjs.yaml` | Syncs the umbrella Helm chart for all Nest services |

## Study path (recommended order)

1. **Render locally** — `helm lint` and `helm template` on `deploy/helm/eshop-nestjs` (see chart README).
2. **Install Argo CD** — follow upstream docs; expose the UI with port-forward or Ingress.
3. **Point repo URL** — edit `spec.source.repoURL` in the manifests to your fork (HTTPS or SSH).
4. **Bootstrap app-of-apps** — `kubectl apply -f deploy/argocd/app-of-apps.yaml` in the Argo CD namespace.
5. **Observe sync** — Argo CD creates the `eshop-nestjs` Application; review diff, then Sync.
6. **Iterate** — change `values.yaml` or Application `helm.parameters`; watch drift detection and rollback.

## Helm path alignment

The Application `spec.source.path` is **`deploy/helm/eshop-nestjs`** relative to the monorepo root. `targetRevision` tracks your Git branch; `destination.namespace` isolates workloads (default `eshop`).

Override image registry or per-service replicas with Argo CD `helm.parameters` or a values file referenced in `spec.source.helm.valueFiles`.

## What this does not cover

- Sealed Secrets / External Secrets operators
- Progressive delivery (Argo Rollouts)
- Multi-cluster app-of-apps fan-out

Treat those as follow-on exercises after a successful first sync.
