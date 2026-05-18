import { useCallback, useMemo, useState } from 'react';

import type { NestServiceCatalogEntry } from '../catalog/types';
import { queryJaegerTraces, summarizeJaegerTrace, type JaegerTraceSummary } from '../observability/query-jaeger';
import { jaegerLookbackFromPreset, lookbackHoursFromPreset, type TimeRangePreset } from '../observability/time-range';
import { DataPanel } from '../shared/data-panel';
import { ExternalLink } from '../shared/external-link';
import { GhostButtonLink } from '../shared/ghost-button-link';
import { ObservabilityFilterPanel } from '../shared/observability-filter-panel';
import { ObservabilityServiceFilters } from '../shared/observability-service-filters';
import { ObservabilityStatus } from '../shared/observability-status';
import { PageHeader } from '../shared/page-header';
import { useObservabilityFilterPanel } from '../shared/use-observability-filter-panel';
import { buildJaegerSearchUrl } from '../telemetry/build-jaeger-url';
import { getObservabilityApiPaths, type OpsTelemetryConfig } from '../telemetry/ops-config';

type TracesPageProps = {
  services: NestServiceCatalogEntry[];
  telemetry: OpsTelemetryConfig;
};

export function TracesPage({ services, telemetry }: TracesPageProps) {
  const apiPaths = useMemo(() => getObservabilityApiPaths(), []);
  const [serviceName, setServiceName] = useState(services[0]?.otelServiceName ?? 'catalog-service');
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('1h');
  const [error, setError] = useState<string | null>(null);
  const [traces, setTraces] = useState<JaegerTraceSummary[]>([]);

  const jaegerUrl = useMemo(
    () => buildJaegerSearchUrl(telemetry.jaegerUrl, serviceName, lookbackHoursFromPreset(timeRange)),
    [serviceName, telemetry.jaegerUrl, timeRange],
  );

  const loadTraces = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      setError(null);

      try {
        const raw = await queryJaegerTraces(
          apiPaths,
          {
            service: serviceName,
            lookback: jaegerLookbackFromPreset(timeRange),
            limit: 30,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        const summaries = raw
          .map(summarizeJaegerTrace)
          .filter((entry): entry is JaegerTraceSummary => entry !== null)
          .sort((left, right) => right.startTimeMs - left.startTimeMs);
        setTraces(summaries);
      } catch (cause) {
        if (signal?.aborted || (cause as Error).name === 'AbortError') {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Failed to load traces');
        setTraces([]);
      }
    },
    [apiPaths, serviceName, timeRange],
  );

  const filterPanel = useObservabilityFilterPanel(loadTraces, [loadTraces]);

  return (
    <section className="ops-page">
      <PageHeader
        title="Traces"
        description="Recent distributed traces from Jaeger for the selected service."
        actions={<GhostButtonLink href={jaegerUrl}>Open in Jaeger UI</GhostButtonLink>}
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
        isEmpty={!filterPanel.loading && !error && traces.length === 0}
        emptyMessage="No traces in this window. Ensure services send OTLP to the collector (pnpm dev + pnpm infra:up)."
      />

      {traces.length > 0 ? (
        <DataPanel>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Start</th>
                <th>Operation</th>
                <th>Duration</th>
                <th>Spans</th>
                <th>Trace ID</th>
              </tr>
            </thead>
            <tbody>
              {traces.map((trace) => (
                <tr key={trace.traceId}>
                  <td>{new Date(trace.startTimeMs).toLocaleString()}</td>
                  <td>{trace.operation}</td>
                  <td>{trace.durationMs} ms</td>
                  <td>{trace.spanCount}</td>
                  <td>
                    <ExternalLink href={`${telemetry.jaegerUrl.replace(/\/$/, '')}/trace/${trace.traceId}`}>
                      {trace.traceId.slice(0, 12)}…
                    </ExternalLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>
      ) : null}
    </section>
  );
}
