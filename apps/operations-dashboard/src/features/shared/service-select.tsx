import type { NestServiceCatalogEntry } from '../catalog/types';
import { ALL_SERVICES } from './service-scope';

type ServiceSelectProps = {
  services: NestServiceCatalogEntry[];
  value: string;
  onChange: (serviceKey: string) => void;
  includeAll?: boolean;
};

export function ServiceSelect({ services, value, onChange, includeAll = false }: ServiceSelectProps) {
  return (
    <label className="ops-field">
      <span>Service</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {includeAll ? (
          <option value={ALL_SERVICES}>All services</option>
        ) : null}
        {services.map((service) => (
          <option key={service.id} value={service.otelServiceName}>
            {service.title}
          </option>
        ))}
      </select>
    </label>
  );
}
