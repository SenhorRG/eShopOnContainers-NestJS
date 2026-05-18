export function buildRequestRateQuery(serviceName: string): string {
  return `sum(rate(http_server_duration_milliseconds_count{exported_job="${serviceName}"}[5m]))`;
}

export function buildErrorRateQuery(serviceName: string): string {
  return `sum(rate(http_server_duration_milliseconds_count{exported_job="${serviceName}",http_status_code=~"5.."}[5m]))`;
}

export function buildLatencyP95Query(serviceName: string): string {
  return `histogram_quantile(0.95, sum by (le) (rate(http_server_duration_milliseconds_bucket{exported_job="${serviceName}",http_status_code="200"}[5m])))`;
}

export function buildEventBusPublishRateQuery(serviceName: string): string {
  return `sum(rate(eshop_eventbus_publish_duration_ms_count{exported_job="${serviceName}"}[5m]))`;
}
