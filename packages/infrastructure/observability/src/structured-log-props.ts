import { trace } from '@opentelemetry/api';
import type { IncomingMessage } from 'node:http';

import { correlationIdFromRequest } from './correlation-id';

const zeroTrace = '00000000000000000000000000000000';
const zeroSpan = '0000000000000000';

export function resolveStructuredLogServiceName(): string {
  return process.env.OTEL_SERVICE_NAME?.trim() || 'eshop-nest-unknown';
}

export function createStructuredLogProps(req?: IncomingMessage): Record<string, string> {
  const props: Record<string, string> = {
    service_name: resolveStructuredLogServiceName(),
  };

  const correlationId = correlationIdFromRequest(req);
  if (correlationId) {
    props.correlation_id = correlationId;
  }

  const ctx = trace.getActiveSpan()?.spanContext();
  const traceId = ctx?.traceId;
  const spanId = ctx?.spanId;

  if (traceId && traceId !== zeroTrace) {
    props.trace_id = traceId;
  }
  if (spanId && spanId !== zeroSpan) {
    props.span_id = spanId;
  }

  return props;
}
