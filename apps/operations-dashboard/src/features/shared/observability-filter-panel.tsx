import type { ReactNode } from 'react';

import { formatLastRefreshed } from './format-last-refreshed';

type ObservabilityFilterPanelProps = {
  children: ReactNode;
  loading: boolean;
  onRefresh: () => void;
  lastRefreshedAt?: Date | null;
};

export function ObservabilityFilterPanel({
  children,
  loading,
  onRefresh,
  lastRefreshedAt,
}: ObservabilityFilterPanelProps) {
  return (
    <div className="ops-filter-panel">
      <div className="ops-filter-panel__filters">{children}</div>
      <div className="ops-filter-panel__actions">
        {lastRefreshedAt ? (
          <span className="ops-filter-panel__meta ops-muted">Updated {formatLastRefreshed(lastRefreshedAt)}</span>
        ) : null}
        <button type="button" className="ops-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
