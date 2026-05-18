import type { TransportSingleOptions } from 'pino';

import { isOtelSdkDisabled } from './is-otel-sdk-disabled';
import { resolveOtlpEndpoint } from './resolve-otlp-endpoint';
import { resolveStructuredLogServiceName } from './structured-log-props';

export function resolvePinoOtelTransport(): TransportSingleOptions | undefined {
  if (isOtelSdkDisabled()) return undefined;

  const logsEndpoint = resolveOtlpEndpoint('logs');
  if (!logsEndpoint) return undefined;

  return {
    target: 'pino-opentelemetry-transport',
    options: {
      resourceAttributes: {
        'service.name': resolveStructuredLogServiceName(),
      },
    },
  };
}
