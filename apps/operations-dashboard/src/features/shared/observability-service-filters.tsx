import type { NestServiceCatalogEntry } from '../catalog/types';
import type { TimeRangePreset } from '../observability/time-range';
import { ServiceSelect } from './service-select';
import { TimeRangeSelect } from './time-range-select';

type ObservabilityServiceFiltersProps = {
  services: NestServiceCatalogEntry[];
  serviceValue: string;
  onServiceChange: (value: string) => void;
  timeRange: TimeRangePreset;
  onTimeRangeChange: (value: TimeRangePreset) => void;
  includeAllServices?: boolean;
};

export function ObservabilityServiceFilters({
  services,
  serviceValue,
  onServiceChange,
  timeRange,
  onTimeRangeChange,
  includeAllServices = false,
}: ObservabilityServiceFiltersProps) {
  return (
    <>
      <ServiceSelect
        services={services}
        value={serviceValue}
        onChange={onServiceChange}
        includeAll={includeAllServices}
      />
      <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
    </>
  );
}
