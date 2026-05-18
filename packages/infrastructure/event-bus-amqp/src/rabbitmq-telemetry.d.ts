import { trace, type Context } from '@opentelemetry/api';
export declare class RabbitMqTelemetry {
    static readonly activitySourceName = "EventBusRabbitMQ";
    private readonly tracer;
    getTracer(): ReturnType<typeof trace.getTracer>;
    normalizeIncomingHeaders(headers?: Record<string, unknown> | null): Record<string, unknown>;
    extractContext(headers?: Record<string, unknown>): Context;
    injectTraceContext(carrierStrings: Record<string, string>): void;
}
