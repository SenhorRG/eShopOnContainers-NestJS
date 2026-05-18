import { useEffect, useMemo, useState } from 'react';

import { parseNestServicesJson } from '../features/catalog/parse-local-services';
import { EnvironmentPage } from '../features/environment/environment-page';
import { useHealthPoll } from '../features/health/use-health-poll';
import { LogsPage } from '../features/logs/logs-page';
import { MetricsPage } from '../features/metrics/metrics-page';
import { OverviewPage } from '../features/overview/overview-page';
import { PlatformPage } from '../features/platform/platform-page';
import { TracesPage } from '../features/traces/traces-page';
import { readOpsTelemetryConfig } from '../features/telemetry/ops-config';
import { NavTabs, type OpsTabId } from './nav-tabs';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<OpsTabId>('overview');
  const services = useMemo(
    () => parseNestServicesJson(import.meta.env.VITE_ESHOP_OPS_SERVICES_JSON),
    [],
  );
  const telemetry = useMemo(() => readOpsTelemetryConfig(), []);
  const health = useHealthPoll(services);

  useEffect(() => {
    document.title = 'eShop operations hub';
  }, []);

  return (
    <div className="ops-shell">
      <header className="ops-header">
        <div>
          <p className="ops-eyebrow">eShop Nest local operations</p>
          <h1>Operations hub</h1>
        </div>
        <p className="ops-muted">
          Local health checks plus embedded logs, traces, and metrics (backed by Loki, Jaeger, and Prometheus).
        </p>
      </header>

      <NavTabs activeTab={activeTab} onChange={setActiveTab} />

      <main className="ops-main">
        {activeTab === 'overview' ? (
          <OverviewPage services={services} health={health} telemetry={telemetry} />
        ) : null}
        {activeTab === 'platform' ? <PlatformPage /> : null}
        {activeTab === 'traces' ? <TracesPage services={services} telemetry={telemetry} /> : null}
        {activeTab === 'metrics' ? <MetricsPage services={services} telemetry={telemetry} /> : null}
        {activeTab === 'logs' ? <LogsPage services={services} telemetry={telemetry} /> : null}
        {activeTab === 'environment' ? <EnvironmentPage /> : null}
      </main>
    </div>
  );
}
