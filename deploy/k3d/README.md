# k3d local Kubernetes (optional)

Rehearse in-cluster networking, probes, and Helm installs without a cloud cluster. **Compose + `pnpm dev` remain the canonical fast loop.**

## Prerequisites

| Tool | Purpose |
|------|---------|
| [k3d](https://k3d.io/) | Local K3s cluster |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | Cluster access |
| [helm](https://helm.sh/) | Chart install |
| Docker | Image build/import (`make load-images`) |

## Lifecycle (Makefile)

From the monorepo root (Git Bash / WSL / Linux / macOS):

```bash
make -C deploy/k3d k3d-up
make -C deploy/k3d helm-install-dev
make -C deploy/k3d k3d-down
```

Optional image import before Helm (study images are placeholders until you build):

```bash
make -C deploy/k3d load-images
```

Teardown with dangling image prune:

```bash
K3D_PRUNE_IMAGES=1 make -C deploy/k3d k3d-down
```

## Validation

```bash
helm lint deploy/helm/eshop-nestjs
kubectl --context k3d-eshop-dev get pods -n eshop-dev
helm template eshop deploy/helm/eshop-nestjs -f deploy/helm/eshop-nestjs/values-dev.yaml
```

See `deploy/helm/eshop-nestjs/README.md` and `deploy/argocd/README.md` for GitOps after the cluster exists.
