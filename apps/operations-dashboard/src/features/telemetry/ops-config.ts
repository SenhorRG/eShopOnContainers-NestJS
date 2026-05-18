export type OpsTelemetryConfig = {
  grafanaUrl: string;
  prometheusUrl: string;
  lokiUrl: string;
  jaegerUrl: string;
  grafanaDashboardUrl: string;
};

export type ObservabilityApiPaths = {
  loki: string;
  prometheus: string;
  jaeger: string;
};

export function getObservabilityApiPaths(): ObservabilityApiPaths {
  return {
    loki: '/observability/loki',
    prometheus: '/observability/prometheus',
    jaeger: '/observability/jaeger',
  };
}

export function readOpsTelemetryConfig(): OpsTelemetryConfig {
  const grafanaUrl = (import.meta.env.VITE_ESHOP_GRAFANA_URL ?? 'http://localhost:3200').replace(/\/$/, '');
  const prometheusUrl = (import.meta.env.VITE_ESHOP_PROMETHEUS_URL ?? 'http://localhost:9099').replace(/\/$/, '');
  const lokiUrl = (import.meta.env.VITE_ESHOP_LOKI_URL ?? 'http://localhost:3100').replace(/\/$/, '');
  const jaegerUrl = (import.meta.env.VITE_ESHOP_JAEGER_URL ?? 'http://localhost:16686').replace(/\/$/, '');

  return {
    grafanaUrl,
    prometheusUrl,
    lokiUrl,
    jaegerUrl,
    grafanaDashboardUrl: `${grafanaUrl}/d/eshop-dev-overview/eshop-nest-overview`,
  };
}
