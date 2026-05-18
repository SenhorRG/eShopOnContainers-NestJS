# k3d helpers (from repo root: make -C deploy/k3d <target>)
ROOT := $(abspath ../..)
export K3D_CLUSTER_NAME ?= eshop-dev
CONFIG := $(CURDIR)/k3d-config.yaml
CHART := $(ROOT)/deploy/helm/eshop-nestjs
HELM_RELEASE ?= eshop
HELM_NAMESPACE ?= eshop-dev
K3D_IMAGE_TAG ?= local

.PHONY: k3d-up k3d-down helm-install-dev load-images

k3d-up:
	@command -v k3d >/dev/null 2>&1 || { echo "k3d is required. Install: https://k3d.io/" >&2; exit 1; }
	@if k3d cluster list 2>/dev/null | grep -q "$(K3D_CLUSTER_NAME)"; then \
		echo "k3d cluster '$(K3D_CLUSTER_NAME)' already exists (skip create)."; \
	else \
		k3d cluster create --config "$(CONFIG)"; \
		echo "Cluster '$(K3D_CLUSTER_NAME)' is ready. Context: k3d-$(K3D_CLUSTER_NAME)"; \
	fi

helm-install-dev:
	@command -v helm >/dev/null 2>&1 || { echo "helm is required. Install: https://helm.sh/docs/intro/install/" >&2; exit 1; }
	@command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required." >&2; exit 1; }
	@kubectl get namespace "$(HELM_NAMESPACE)" >/dev/null 2>&1 || kubectl create namespace "$(HELM_NAMESPACE)"
	helm upgrade --install "$(HELM_RELEASE)" "$(CHART)" \
		--namespace "$(HELM_NAMESPACE)" \
		--create-namespace \
		-f "$(CHART)/values-dev.yaml" \
		--wait --timeout 10m
	@echo "Helm release '$(HELM_RELEASE)' installed in namespace '$(HELM_NAMESPACE)'."

k3d-down:
	@command -v k3d >/dev/null 2>&1 || { echo "k3d is required. Install: https://k3d.io/" >&2; exit 1; }
	@if k3d cluster list 2>/dev/null | grep -q "$(K3D_CLUSTER_NAME)"; then \
		k3d cluster delete "$(K3D_CLUSTER_NAME)"; \
		echo "Deleted k3d cluster '$(K3D_CLUSTER_NAME)'."; \
	else \
		echo "No cluster named '$(K3D_CLUSTER_NAME)'."; \
	fi
	@if [ "$(K3D_PRUNE_IMAGES)" = "1" ]; then \
		docker image prune -f >/dev/null 2>&1 || true; \
		echo "Pruned dangling Docker images (K3D_PRUNE_IMAGES=1)."; \
	fi

load-images:
	@command -v k3d >/dev/null 2>&1 && command -v docker >/dev/null 2>&1 || { echo "k3d and docker are required." >&2; exit 1; }
	docker build -f "$(ROOT)/deploy/docker/Dockerfile.nest.template" \
		--build-arg PNPM_FILTER=@eshop/catalog-service \
		-t eshop/catalog-service:$(K3D_IMAGE_TAG) "$(ROOT)"
	k3d image import eshop/catalog-service:$(K3D_IMAGE_TAG) -c $(K3D_CLUSTER_NAME)
	docker build -f "$(ROOT)/deploy/docker/Dockerfile.nest.template" \
		--build-arg PNPM_FILTER=@eshop/identity-service \
		-t eshop/identity-service:$(K3D_IMAGE_TAG) "$(ROOT)"
	k3d image import eshop/identity-service:$(K3D_IMAGE_TAG) -c $(K3D_CLUSTER_NAME)
	@echo "Imported catalog-service and identity-service as :$(K3D_IMAGE_TAG). Override chart image tags to match."
