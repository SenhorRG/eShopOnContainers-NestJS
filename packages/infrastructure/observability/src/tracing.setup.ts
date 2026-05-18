import {
  bootstrapObservability,
  shutdownObservability,
  type BootstrapObservabilityOptions,
} from './bootstrap-observability';

export type InitializeTracingOptions = BootstrapObservabilityOptions;

export function initializeTracing(options: InitializeTracingOptions): void {
  bootstrapObservability(options);
}

export async function shutdownTracing(): Promise<void> {
  await shutdownObservability();
}
