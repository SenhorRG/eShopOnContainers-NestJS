import { buildServiceLogQueries } from './build-logql';
import type { BuildLogQueryInput } from './build-logql';
import { queryLokiRange, type LokiQueryRangeResult } from './query-loki';
import type { ObservabilityApiPaths } from '../telemetry/ops-config';

export async function fetchServiceLogs(
  paths: ObservabilityApiPaths,
  input: BuildLogQueryInput,
  range: { startNs: string; endNs: string; limit?: number },
  signal?: AbortSignal,
): Promise<LokiQueryRangeResult> {
  const queries = buildServiceLogQueries(input);
  const results = await Promise.all(
    queries.map((query) =>
      queryLokiRange(paths, { query, ...range }, signal).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('(400)') && queries.length > 1) {
          return { streams: [] } satisfies LokiQueryRangeResult;
        }
        throw error;
      }),
    ),
  );

  const streamMap = new Map<string, LokiQueryRangeResult['streams'][number]>();

  for (const result of results) {
    for (const stream of result.streams) {
      const key = JSON.stringify(stream.stream);
      const existing = streamMap.get(key);
      if (existing) {
        existing.values.push(...stream.values);
      } else {
        streamMap.set(key, { ...stream, values: [...stream.values] });
      }
    }
  }

  return { streams: [...streamMap.values()] };
}
