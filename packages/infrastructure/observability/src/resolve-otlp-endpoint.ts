export type OtlpSignal = 'traces' | 'metrics' | 'logs';

const signalEnv: Record<OtlpSignal, string> = {
  traces: 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
  metrics: 'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT',
  logs: 'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
};

export function resolveOtlpEndpoint(signal: OtlpSignal, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const signalValue = process.env[signalEnv[signal]]?.trim();
  if (signalValue) return signalValue;
  return process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
}

export function normalizeOtlpSignalUrl(raw: string, signal: OtlpSignal): string {
  const trimmed = raw.replace(/\/$/, '');
  const suffix = `/v1/${signal}`;
  if (trimmed.endsWith(suffix)) return trimmed;
  return `${trimmed}${suffix}`;
}
