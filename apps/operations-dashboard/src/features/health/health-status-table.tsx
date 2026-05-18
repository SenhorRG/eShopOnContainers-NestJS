import type { NestServiceCatalogEntry } from '../catalog/types';
import type { HealthPollState } from './use-health-poll';

type HealthStatusTableProps = {
  services: NestServiceCatalogEntry[];
  health: HealthPollState;
};

function renderStatus(status: HealthPollState[string] | undefined): string {
  if (!status || status.status === 'pending') return '…';
  if (status.status === 'ok') return 'healthy';
  return 'unhealthy';
}

export function HealthStatusTable({ services, health }: HealthStatusTableProps) {
  return (
    <table className="ops-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Status</th>
          <th>RTT</th>
        </tr>
      </thead>
      <tbody>
        {services.map((service) => {
          const probe = health[service.id];
          return (
            <tr key={service.id}>
              <td>{service.title}</td>
              <td className={probe?.status === 'ok' ? 'ops-ok' : probe?.status === 'fail' ? 'ops-fail' : ''}>
                {renderStatus(probe)}
              </td>
              <td>{probe?.rttMs != null ? `${probe.rttMs} ms` : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
