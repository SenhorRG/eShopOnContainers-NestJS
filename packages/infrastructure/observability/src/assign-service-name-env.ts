const GENERIC_OTEL_SERVICE_NAME = 'eshop-nest-local';

export function assignOtelServiceName(serviceName: string): string {
  const trimmed = serviceName.trim();
  const existing = process.env.OTEL_SERVICE_NAME?.trim();

  if (existing && existing !== GENERIC_OTEL_SERVICE_NAME) {
    return existing;
  }

  process.env.OTEL_SERVICE_NAME = trimmed;
  return trimmed;
}
