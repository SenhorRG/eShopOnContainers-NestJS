import { useCallback, useMemo, useState } from 'react';

import type { NestServiceCatalogEntry } from '../catalog/types';
import {
  buildErrorRateQuery,
  buildEventBusPublishRateQuery,
  buildLatencyP95Query,
  buildRequestRateQuery,
} from '../observability/build-promql';
import { queryPrometheusInstant, readPrometheusScalar } from '../observability/query-prometheus';
import { resolveTimeWindow, type TimeRangePreset } from '../observability/time-range';
import { ExternalLink } from '../shared/external-link';
import { GhostButtonLink } from '../shared/ghost-button-link';
import { ObservabilityFilterPanel } from '../shared/observability-filter-panel';
import { ObservabilityServiceFilters } from '../shared/observability-service-filters';
import { ObservabilityStatus } from '../shared/observability-status';
import { PageHeader } from '../shared/page-header';
import { useObservabilityFilterPanel } from '../shared/use-observability-filter-panel';
import { buildGrafanaPrometheusExploreUrl } from '../telemetry/build-grafana-explore-url';
import { getObservabilityApiPaths, type OpsTelemetryConfig } from '../telemetry/ops-config';

type MetricsPageProps = {
  services: NestServiceCatalogEntry[];
  telemetry: OpsTelemetryConfig;
};

type MetricCard = {
  id: string;
  title: string;
  value: string;
  hint: string;
};

function formatRate(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (value < 0.01) {
    return `${(value * 1000).toFixed(2)} m/s`;
  }
  return `${value.toFixed(2)} req/s`;
}

function formatLatencyMs(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `${value.toFixed(1)} ms`;
}

export function MetricsPage({ services, telemetry }: MetricsPageProps) {
  const apiPaths = useMemo(() => getObservabilityApiPaths(), []);
  const [serviceName, setServiceName] = useState(services[0]?.otelServiceName ?? 'catalog-service');
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('1h');
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<MetricCard[]>([]);

  const exploreUrl = useMemo(
    () => buildGrafanaPrometheusExploreUrl(telemetry.grafanaUrl, serviceName),
    [serviceName, telemetry.grafanaUrl],
  );

  const loadMetrics = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      setError(null);

      try {
        const { endMs } = resolveTimeWindow(timeRange);
        const queries = [
          { id: 'rate', title: 'HTTP request rate', query: buildRequestRateQuery(serviceName), hint: '5m rate' },
          { id: 'errors', title: 'HTTP 5xx rate', query: buildErrorRateQuery(serviceName), hint: '5m rate' },
          { id: 'p95', title: 'Latency p95', query: buildLatencyP95Query(serviceName), hint: 'successful requests' },
          {
            id: 'bus',
            title: 'Event bus publish rate',
            query: buildEventBusPublishRateQuery(serviceName),
            hint: 'when the service publishes integration events',
          },
        ];

        const results = await Promise.all(
          queries.map(async (entry) => {
            const samples = await queryPrometheusInstant(apiPaths, entry.query, endMs, signal);
            return { ...entry, scalar: readPrometheusScalar(samples) };
          }),
        );

        if (signal?.aborted) {
          return;
        }

        setCards(
          results.map((entry) => ({
            id: entry.id,
            title: entry.title,
            hint: entry.hint,
            value: entry.id === 'p95' ? formatLatencyMs(entry.scalar) : formatRate(entry.scalar),
          })),
        );
      } catch (cause) {
        if (signal?.aborted || (cause as Error).name === 'AbortError') {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Failed to load metrics');
        setCards([]);
      }
    },
    [apiPaths, serviceName, timeRange],
  );

  const filterPanel = useObservabilityFilterPanel(loadMetrics, [loadMetrics]);

  return (
    <section className="ops-page">
      <PageHeader
        title="Metrics"
        description="Prometheus snapshots for HTTP and event-bus signals (same queries as the Grafana overview)."
        actions={
          <>
            <GhostButtonLink href={telemetry.grafanaDashboardUrl}>Grafana dashboard</GhostButtonLink>
            <GhostButtonLink href={exploreUrl}>Explore in Grafana</GhostButtonLink>
          </>
        }
      />

      <ObservabilityFilterPanel
        loading={filterPanel.loading}
        onRefresh={filterPanel.refreshNow}
        lastRefreshedAt={filterPanel.lastRefreshedAt}
      >
        <ObservabilityServiceFilters
          services={services}
          serviceValue={serviceName}
          onServiceChange={setServiceName}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </ObservabilityFilterPanel>

      <ObservabilityStatus
        error={error}
        isEmpty={!filterPanel.loading && !error && cards.every((card) => card.value === '—')}
        emptyMessage="No Prometheus samples for this service. Scrape the OTEL collector (pnpm infra:up) and generate traffic with pnpm dev."
      />

      {cards.length > 0 ? (
        <div className="ops-summary-grid">
          {cards.map((card) => (
            <article key={card.id} className="ops-card">
              <h2>{card.title}</h2>
              <p className="ops-card__metric">{card.value}</p>
              <p className="ops-muted">{card.hint}</p>
            </article>
          ))}
        </div>
      ) : null}

      <ul className="ops-link-list">
        <li>
          <ExternalLink href={telemetry.prometheusUrl}>Prometheus UI (advanced queries)</ExternalLink>
        </li>
      </ul>
    </section>
  );
}
