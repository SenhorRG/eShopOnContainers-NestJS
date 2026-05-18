import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export function createServiceNameResourceAttributes(serviceName: string): Record<string, string> {
  return { [ATTR_SERVICE_NAME]: serviceName };
}
