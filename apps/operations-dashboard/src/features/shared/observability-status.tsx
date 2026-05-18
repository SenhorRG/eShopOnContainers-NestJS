type ObservabilityStatusProps = {
  error: string | null;
  emptyMessage?: string;
  isEmpty?: boolean;
};

export function ObservabilityStatus({ error, emptyMessage, isEmpty }: ObservabilityStatusProps) {
  if (error) {
    return (
      <div className="ops-alert ops-alert--error" role="alert">
        <p>{error}</p>
        <p className="ops-muted">
          Run <code>pnpm infra:up</code> (infra + Loki/Jaeger/Prometheus/Grafana in one command), then{' '}
          <code>pnpm dev</code> so services export OTLP, and refresh.
        </p>
      </div>
    );
  }

  if (isEmpty && emptyMessage) {
    return <p className="ops-muted">{emptyMessage}</p>;
  }

  return null;
}
