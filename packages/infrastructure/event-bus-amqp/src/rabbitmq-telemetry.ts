import { context, propagation, trace, type Context } from '@opentelemetry/api';

const textMapGetter = {
  get(carrier: Record<string, unknown>, key: string): string | string[] | undefined {
    const k = Object.keys(carrier).find((h) => h.toLowerCase() === key.toLowerCase());
    if (!k) return undefined;
    const raw = carrier[k];
    if (raw == null) return undefined;
    if (typeof raw === 'string' || Array.isArray(raw)) return raw as string | string[];
    return undefined;
  },
  keys(carrier: Record<string, unknown>): string[] {
    return Object.keys(carrier);
  },
};

const textMapSetter = {
  set(carrier: Record<string, string>, key: string, value: string): void {
    carrier[key.toLowerCase()] = value;
  },
};

export class RabbitMqTelemetry {
  static readonly activitySourceName = 'EventBusRabbitMQ';

  private readonly tracer = trace.getTracer(RabbitMqTelemetry.activitySourceName);

  getTracer(): ReturnType<typeof trace.getTracer> {
    return this.tracer;
  }

  normalizeIncomingHeaders(headers?: Record<string, unknown> | null): Record<string, unknown> {
    if (!headers) return {};
    const out: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(headers)) {
      if (value == null) continue;
      if (typeof value === 'string') {
        out[rawKey.toLowerCase()] = value;
      } else if (Buffer.isBuffer(value)) {
        out[rawKey.toLowerCase()] = value.toString('utf8');
      }
    }
    return out;
  }

  extractContext(headers?: Record<string, unknown>): Context {
    const lowered = this.normalizeIncomingHeaders(headers);
    return propagation.extract(context.active(), lowered, textMapGetter);
  }

  injectTraceContext(carrierStrings: Record<string, string>): void {
    propagation.inject(context.active(), carrierStrings, textMapSetter);
  }
}
