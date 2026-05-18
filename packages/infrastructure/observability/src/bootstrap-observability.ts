import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { isOtelSdkDisabled } from './is-otel-sdk-disabled';
import { normalizeOtlpSignalUrl, resolveOtlpEndpoint } from './resolve-otlp-endpoint';
import { resolvePinoOtelTransport } from './resolve-pino-otel-transport';

let sdk: NodeSDK | undefined;

export interface BootstrapObservabilityOptions {
  serviceName: string;
  enabled?: boolean;
  otlpEndpoint?: string;
  tracesEndpoint?: string;
  metricsEndpoint?: string;
  logsEndpoint?: string;
  environment?: string;
  diagVerbose?: boolean;
}

export function bootstrapObservability(options: BootstrapObservabilityOptions): void {
  if (isOtelSdkDisabled() || options.enabled === false) return;

  const tracesEndpoint = resolveOtlpEndpoint('traces', options.tracesEndpoint ?? options.otlpEndpoint);
  if (!tracesEndpoint) return;

  if (options.diagVerbose || String(process.env.OTEL_DIAG_VERBOSE ?? '').includes('true')) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const env =
    options.environment ?? process.env.NODE_ENV ?? process.env.OTEL_ENVIRONMENT ?? 'development';

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: options.serviceName,
    'deployment.environment': env,
  });

  const metricsEndpoint = resolveOtlpEndpoint('metrics', options.metricsEndpoint ?? options.otlpEndpoint);
  const logsEndpoint = resolveOtlpEndpoint('logs', options.logsEndpoint ?? options.otlpEndpoint);
  const pinoOtelTransport = resolvePinoOtelTransport();

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: normalizeOtlpSignalUrl(tracesEndpoint, 'traces'),
    }),
    metricReader: metricsEndpoint
      ? new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: normalizeOtlpSignalUrl(metricsEndpoint, 'metrics'),
          }),
        })
      : undefined,
    logRecordProcessors:
      logsEndpoint && !pinoOtelTransport
        ? [
            new BatchLogRecordProcessor(
              new OTLPLogExporter({
                url: normalizeOtlpSignalUrl(logsEndpoint, 'logs'),
              }),
            ),
          ]
        : undefined,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
      }),
      new PinoInstrumentation({
        disableLogSending: Boolean(pinoOtelTransport),
      }),
    ],
  });

  sdk.start();
  process.once('beforeExit', () => void shutdownObservability());
}

export async function shutdownObservability(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } finally {
    sdk = undefined;
  }
}
