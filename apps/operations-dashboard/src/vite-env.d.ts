/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESHOP_OPS_SERVICES_JSON?: string;
  readonly VITE_ESHOP_GRAFANA_URL?: string;
  readonly VITE_ESHOP_PROMETHEUS_URL?: string;
  readonly VITE_ESHOP_JAEGER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
