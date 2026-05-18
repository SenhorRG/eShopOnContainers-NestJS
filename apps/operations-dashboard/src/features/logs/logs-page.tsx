import { useCallback, useMemo, useState } from 'react';

import type { NestServiceCatalogEntry } from '../catalog/types';
import type { LogLevelFilter } from '../observability/build-logql';
import { fetchServiceLogs } from '../observability/fetch-service-logs';
import { matchesLogLevelFilter } from '../observability/match-log-level';
import { flattenLokiStreams, parseLogLine } from '../observability/parse-log-line';
import { resolveTimeWindow, toLokiNanoseconds, type TimeRangePreset } from '../observability/time-range';
import { GhostButtonLink } from '../shared/ghost-button-link';
import { ObservabilityFilterPanel } from '../shared/observability-filter-panel';
import { ObservabilityServiceFilters } from '../shared/observability-service-filters';
import { ObservabilityStatus } from '../shared/observability-status';
import { PageHeader } from '../shared/page-header';
import { ALL_SERVICES } from '../shared/service-scope';
import { useObservabilityFilterPanel } from '../shared/use-observability-filter-panel';
import { buildGrafanaLokiExploreUrl } from '../telemetry/build-grafana-explore-url';
import { getObservabilityApiPaths, type OpsTelemetryConfig } from '../telemetry/ops-config';
import { buildLogsEmptyMessage } from './build-logs-empty-message';
import { LogDetailModal } from './log-detail-modal';
import { LogsTable } from './logs-table';
import type { LogRow } from './logs-types';

type LogsPageProps = {
  services: NestServiceCatalogEntry[];
  telemetry: OpsTelemetryConfig;
};

export function LogsPage({ services, telemetry }: LogsPageProps) {
  const apiPaths = useMemo(() => getObservabilityApiPaths(), []);
  const catalog = useMemo(
    () => services.map((service) => ({ id: service.id, otelServiceName: service.otelServiceName })),
    [services],
  );
  const [serviceKey, setServiceKey] = useState(ALL_SERVICES);
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('1h');
  const [level, setLevel] = useState<LogLevelFilter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<LogRow | null>(null);

  const exploreUrl = useMemo(
    () => buildGrafanaLokiExploreUrl(telemetry.grafanaUrl, serviceKey),
    [serviceKey, telemetry.grafanaUrl],
  );

  const loadLogs = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      if (!catalog.length) {
        return;
      }

      setError(null);

      try {
        const { startMs, endMs } = resolveTimeWindow(timeRange);
        const result = await fetchServiceLogs(
          apiPaths,
          {
            serviceKey,
            catalog,
            level,
            search,
          },
          {
            startNs: toLokiNanoseconds(startMs),
            endNs: toLokiNanoseconds(endMs),
            limit: 400,
          },
          signal,
        );

        if (signal?.aborted) {
          return;
        }

        const flat = flattenLokiStreams(result.streams);
        const parsedRows = flat
          .map((entry, index) => {
            const parsed = parseLogLine(entry.line, entry.timestampNs, entry.streamLabels);
            return { id: `${entry.timestampNs}-${index}`, ...parsed };
          })
          .filter((row) => matchesLogLevelFilter(row.level, level));

        setRows(parsedRows);
      } catch (cause) {
        if (signal?.aborted || (cause as Error).name === 'AbortError') {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Failed to load logs');
        setRows([]);
      }
    },
    [apiPaths, catalog, level, search, serviceKey, timeRange],
  );

  const filterPanel = useObservabilityFilterPanel(loadLogs, [loadLogs]);
  const emptyMessage = useMemo(() => buildLogsEmptyMessage(filterPanel.loading), [filterPanel.loading]);

  return (
    <section className="ops-page">
      <PageHeader
        title="Logs"
        description="Live Loki stream for one or all Nest services (OTLP + Compose containers)."
        actions={<GhostButtonLink href={exploreUrl}>Open in Grafana</GhostButtonLink>}
      />

      <ObservabilityFilterPanel
        loading={filterPanel.loading}
        onRefresh={filterPanel.refreshNow}
        lastRefreshedAt={filterPanel.lastRefreshedAt}
      >
        <ObservabilityServiceFilters
          services={services}
          serviceValue={serviceKey}
          onServiceChange={setServiceKey}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          includeAllServices
        />
        <label className="ops-field">
          <span>Level</span>
          <select value={level} onChange={(event) => setLevel(event.target.value as LogLevelFilter)}>
            <option value="all">All</option>
            <option value="error">Error</option>
            <option value="warn">Warn</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </label>
        <label className="ops-field ops-field--wide">
          <span>Contains</span>
          <input
            type="search"
            value={search}
            placeholder="Filter message text"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </ObservabilityFilterPanel>

      <ObservabilityStatus error={error} />

      <LogsTable rows={rows} emptyMessage={emptyMessage} onViewRow={setSelectedRow} />

      <LogDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </section>
  );
}
