function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readLogAttributes(parsed: Record<string, unknown>): Record<string, unknown> {
  return readRecord(parsed.attributes) ?? parsed;
}

export function resolveLogService(
  streamLabels: Record<string, string>,
  parsed: Record<string, unknown>,
): string {
  const attrs = readLogAttributes(parsed);
  const resources = readRecord(parsed.resources) ?? readRecord(attrs.resources);

  return (
    streamLabels.service_name ??
    readString(attrs.service_name) ??
    readString(resources?.['service.name']) ??
    streamLabels.job ??
    streamLabels.compose_service ??
    'unknown'
  );
}

export function extractLogBody(parsed: Record<string, unknown>): string {
  return readString(parsed.body) ?? readString(parsed.msg) ?? readString(parsed.message) ?? '—';
}

export function extractLogRoute(parsed: Record<string, unknown>): string {
  const attrs = readLogAttributes(parsed);
  const req = readRecord(attrs.req);
  const res = readRecord(attrs.res);
  if (!req) {
    return '—';
  }

  const method = readString(req.method);
  const url = readString(req.url);
  if (!method || !url) {
    return '—';
  }

  const parts = [`${method} ${url}`];
  const status = readNumber(res?.statusCode);
  if (status !== null) {
    parts.push(`→ ${status}`);
  }

  const responseTime = readNumber(attrs.responseTime);
  if (responseTime !== null) {
    parts.push(`${responseTime}ms`);
  }

  return parts.join(' · ');
}

function formatErrorContext(attrs: Record<string, unknown>): string | null {
  const err = readRecord(attrs.err);
  if (!err) {
    return null;
  }

  const type = readString(err.type);
  const message = readString(err.message);
  if (type && message) {
    return `${type}: ${message}`;
  }
  return message ?? type;
}

function formatEventContext(attrs: Record<string, unknown>): string | null {
  const eventName = readString(attrs.eventName) ?? readString(attrs.event);
  const handler = readString(attrs.handler);
  if (eventName && handler) {
    return `${eventName} (${handler})`;
  }
  return eventName ?? handler;
}

export function extractLogContext(parsed: Record<string, unknown>): string {
  const attrs = readLogAttributes(parsed);
  const resources = readRecord(parsed.resources) ?? readRecord(attrs.resources);
  const parts: string[] = [];

  const err = formatErrorContext(attrs);
  if (err) {
    parts.push(err);
  }

  const event = formatEventContext(attrs);
  if (event) {
    parts.push(event);
  }

  const traceId = readString(attrs.trace_id) ?? readString(resources?.['trace_id']);
  if (traceId) {
    parts.push(`trace ${traceId}`);
  }

  const context = readString(attrs.context);
  if (context) {
    parts.push(context);
  }

  const requestId = readString(attrs.reqId) ?? readString(attrs.requestId);
  if (requestId) {
    parts.push(`request ${requestId}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}
