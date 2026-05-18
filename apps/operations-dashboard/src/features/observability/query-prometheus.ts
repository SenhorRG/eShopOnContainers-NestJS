import type { ObservabilityApiPaths } from '../telemetry/ops-config';

export type PrometheusInstantValue = {
  metric: Record<string, string>;
  value: [number, string];
};

export async function queryPrometheusInstant(
  paths: ObservabilityApiPaths,
  promql: string,
  timeMs: number,
  signal?: AbortSignal,
): Promise<PrometheusInstantValue[]> {
  const url = new URL(`${paths.prometheus}/api/v1/query`, window.location.origin);
  url.searchParams.set('query', promql);
  url.searchParams.set('time', (timeMs / 1000).toFixed(3));

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Prometheus query failed (${response.status})`);
  }

  const body = (await response.json()) as {
    status: string;
    data?: { result?: PrometheusInstantValue[] };
    error?: string;
  };

  if (body.status !== 'success') {
    throw new Error(body.error ?? 'Prometheus returned a non-success status');
  }

  const result = body.data?.result ?? [];
  return Array.isArray(result) ? result : [];
}

export function readPrometheusScalar(samples: PrometheusInstantValue[]): number | null {
  const first = samples[0]?.value?.[1];
  if (first === undefined) {
    return null;
  }
  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : null;
}
