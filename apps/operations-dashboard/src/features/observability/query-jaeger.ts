import type { ObservabilityApiPaths } from '../telemetry/ops-config';

export type JaegerSpan = {
  traceID: string;
  spanID: string;
  operationName: string;
  startTime: number;
  duration: number;
  processID: string;
  references?: Array<{ refType: string; traceID: string; spanID: string }>;
  tags?: Array<{ key: string; value: unknown }>;
};

export type JaegerTrace = {
  traceID: string;
  spans: JaegerSpan[];
  processes: Record<string, { serviceName: string }>;
};

export type JaegerTraceSummary = {
  traceId: string;
  serviceName: string;
  operation: string;
  durationMs: number;
  spanCount: number;
  startTimeMs: number;
};

export async function queryJaegerTraces(
  paths: ObservabilityApiPaths,
  params: { service: string; lookback: string; limit?: number },
  signal?: AbortSignal,
): Promise<JaegerTrace[]> {
  const url = new URL(`${paths.jaeger}/api/traces`, window.location.origin);
  url.searchParams.set('service', params.service);
  url.searchParams.set('lookback', params.lookback);
  url.searchParams.set('limit', String(params.limit ?? 25));

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Jaeger query failed (${response.status})`);
  }

  const body = (await response.json()) as { data?: JaegerTrace[]; errors?: Array<{ msg: string }> };
  if (body.errors?.length) {
    throw new Error(body.errors.map((entry) => entry.msg).join('; '));
  }

  return body.data ?? [];
}

function isRootSpan(span: JaegerSpan): boolean {
  const refs = span.references ?? [];
  return !refs.some((ref) => ref.refType === 'CHILD_OF');
}

export function summarizeJaegerTrace(trace: JaegerTrace): JaegerTraceSummary | null {
  if (!trace.spans.length) {
    return null;
  }

  const root = trace.spans.find(isRootSpan) ?? trace.spans[0];
  const process = trace.processes[root.processID];
  const startTimeMs = Math.min(...trace.spans.map((span) => span.startTime / 1000));
  const endTimeMs = Math.max(...trace.spans.map((span) => (span.startTime + span.duration) / 1000));

  return {
    traceId: trace.traceID,
    serviceName: process?.serviceName ?? 'unknown',
    operation: root.operationName,
    durationMs: Math.round(endTimeMs - startTimeMs),
    spanCount: trace.spans.length,
    startTimeMs: Math.round(startTimeMs),
  };
}
