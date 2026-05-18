import type { ObservabilityApiPaths } from '../telemetry/ops-config';

export type LokiQueryRangeResult = {
  streams: Array<{ stream: Record<string, string>; values: Array<[string, string]> }>;
};

export async function queryLokiRange(
  paths: ObservabilityApiPaths,
  params: { query: string; startNs: string; endNs: string; limit?: number },
  signal?: AbortSignal,
): Promise<LokiQueryRangeResult> {
  const url = new URL(`${paths.loki}/loki/api/v1/query_range`, window.location.origin);
  url.searchParams.set('query', params.query);
  url.searchParams.set('start', params.startNs);
  url.searchParams.set('end', params.endNs);
  url.searchParams.set('limit', String(params.limit ?? 500));
  url.searchParams.set('direction', 'backward');

  const response = await fetch(url, { signal });
  const body = (await response.json()) as {
    status: string;
    data?: { result?: LokiQueryRangeResult['streams'] };
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? `Loki query failed (${response.status})`);
  }

  if (body.status !== 'success') {
    throw new Error(body.error ?? 'Loki returned a non-success status');
  }

  return { streams: body.data?.result ?? [] };
}
