import type { NestServiceCatalogEntry } from '../catalog/types';
import { HealthStatusTable } from '../health/health-status-table';
import { summarizeHealth, type HealthPollState } from '../health/use-health-poll';
import { ExternalLink } from '../shared/external-link';
import { PageHeader } from '../shared/page-header';
import type { OpsTelemetryConfig } from '../telemetry/ops-config';

type OverviewPageProps = {
  services: NestServiceCatalogEntry[];
  health: HealthPollState;
  telemetry: OpsTelemetryConfig;
};

export function OverviewPage({ services, health, telemetry }: OverviewPageProps) {
  const summary = summarizeHealth(health);

  return (
    <section className="ops-page">
      <PageHeader title="Overview" description="Service readiness and observability shortcuts." />

      <div className="ops-summary-grid">
        <article className="ops-card">
          <h2>Readiness</h2>
          <p className="ops-card__metric">
            {summary.healthy}/{summary.total || services.length}
          </p>
          <p className="ops-muted">services reporting healthy</p>
        </article>
        <article className="ops-card">
          <h2>Grafana</h2>
          <ExternalLink href={telemetry.grafanaUrl}>Open Grafana</ExternalLink>
        </article>
        <article className="ops-card">
          <h2>RED dashboard</h2>
          <ExternalLink href={telemetry.grafanaDashboardUrl}>Open overview dashboard</ExternalLink>
        </article>
        <article className="ops-card">
          <h2>Jaeger</h2>
          <ExternalLink href={telemetry.jaegerUrl}>Open traces</ExternalLink>
        </article>
      </div>

      <h2>Service readiness</h2>
      <HealthStatusTable services={services} health={health} />
    </section>
  );
}
