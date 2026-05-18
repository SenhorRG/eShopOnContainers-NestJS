import type { IntegrationJson } from '@eshop/event-bus-amqp';

export function reviveUuid(id: IntegrationJson[string]): string | undefined {
  const v = id as string | undefined;
  return v ? String(v) : undefined;
}

export function reviveIso(date: IntegrationJson[string]): string | undefined {
  const v = date as string | undefined;
  if (!v) return undefined;
  if (typeof v === 'string') return v.includes('T') ? v : new Date(v).toISOString();
  return undefined;
}
