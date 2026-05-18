import { WebhookType } from './webhook-type';

/** Same wire shape as reference `WebhookData` (serialized twice: inner payload string + outer JSON). */
export interface WebhookWirePayload {
  when: string;
  type: string;
  payload: string;
}

export function buildWebhookWirePayload(
  hookType: WebhookType,
  integrationEvent: unknown,
): WebhookWirePayload {
  const typeName = WebhookType[hookType] as string;
  return {
    when: new Date().toISOString(),
    type: typeName,
    payload: JSON.stringify(integrationEvent as object),
  };
}
