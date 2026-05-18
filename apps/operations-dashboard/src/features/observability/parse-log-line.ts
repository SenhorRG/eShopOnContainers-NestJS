import {
  extractLogBody,
  extractLogContext,
  extractLogRoute,
  resolveLogService,
} from './extract-log-fields';

export type ParsedLogLine = {
  timestamp: string;
  service: string;
  level: string;
  body: string;
  context: string;
  route: string;
  raw: string;
};

const LEVEL_LABELS: Record<number, string> = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

function levelFromNumeric(value: number): string {
  return LEVEL_LABELS[value] ?? String(value);
}

function levelFromUnknown(value: unknown): string {
  if (typeof value === 'number') {
    return levelFromNumeric(value);
  }
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return 'info';
}

function formatLogTimestamp(timestampNs: string): string {
  const ms = Number(timestampNs) / 1_000_000;
  if (!Number.isFinite(ms)) {
    return timestampNs;
  }
  return new Date(ms).toLocaleString();
}

export function parseLogLine(
  raw: string,
  timestampNs: string,
  streamLabels: Record<string, string> = {},
): ParsedLogLine {
  const timestamp = formatLogTimestamp(timestampNs);

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const level =
      streamLabels.level?.toLowerCase() ??
      (typeof parsed.severity === 'string' ? parsed.severity.toLowerCase() : levelFromUnknown(parsed.level));

    return {
      timestamp,
      service: resolveLogService(streamLabels, parsed),
      level,
      body: extractLogBody(parsed),
      context: extractLogContext(parsed),
      route: extractLogRoute(parsed),
      raw,
    };
  } catch {
    const levelMatch = raw.match(/\b(ERROR|WARN|INFO|DEBUG|FATAL)\b/i);
    return {
      timestamp,
      service: streamLabels.service_name ?? streamLabels.job ?? streamLabels.compose_service ?? 'unknown',
      level: levelMatch?.[1]?.toLowerCase() ?? 'info',
      body: raw,
      context: '—',
      route: '—',
      raw,
    };
  }
}

export function flattenLokiStreams(
  streams: Array<{ stream: Record<string, string>; values: Array<[string, string]> }>,
): Array<{ timestampNs: string; line: string; streamLabels: Record<string, string> }> {
  const rows: Array<{ timestampNs: string; line: string; streamLabels: Record<string, string> }> = [];
  for (const stream of streams) {
    for (const [timestampNs, line] of stream.values) {
      rows.push({ timestampNs, line, streamLabels: stream.stream });
    }
  }
  return rows.sort((left, right) => Number(right.timestampNs) - Number(left.timestampNs));
}
