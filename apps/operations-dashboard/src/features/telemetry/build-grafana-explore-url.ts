function buildExploreUrl(grafanaBaseUrl: string, pane: Record<string, unknown>): string {
  const trimmed = grafanaBaseUrl.replace(/\/$/, '');
  const left = encodeURIComponent(JSON.stringify(pane));
  return `${trimmed}/explore?orgId=1&left=${left}`;
}

export function buildGrafanaLokiExploreUrl(grafanaBaseUrl: string, serviceName: string): string {
  const expr =
    serviceName === '__all__'
      ? '{service_name=~".+"}'
      : `{service_name="${serviceName}"}`;
  return buildExploreUrl(grafanaBaseUrl, {
    datasource: 'loki',
    queries: [{ refId: 'A', expr }],
    range: { from: 'now-1h', to: 'now' },
  });
}

export function buildGrafanaPrometheusExploreUrl(grafanaBaseUrl: string, serviceName: string): string {
  return buildExploreUrl(grafanaBaseUrl, {
    datasource: 'prom',
    queries: [
      {
        refId: 'A',
        expr: `sum(rate(http_server_duration_milliseconds_count{exported_job="${serviceName}"}[5m]))`,
      },
    ],
    range: { from: 'now-1h', to: 'now' },
  });
}
