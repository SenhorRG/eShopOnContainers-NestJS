/** Webhook kind values accepted by the API. */
export enum WebhookType {
  CatalogItemPriceChange = 1,
  OrderShipped = 2,
  OrderPaid = 3,
}

export function parseWebhookTypeFromEventString(raw: string): WebhookType | undefined {
  const trimmed = raw.trim();
  if (!trimmed.length) return undefined;

  const lower = trimmed.toLowerCase();
  const entries: [string, WebhookType][] = [
    ['catalogitempricechange', WebhookType.CatalogItemPriceChange],
    ['ordershipped', WebhookType.OrderShipped],
    ['orderpaid', WebhookType.OrderPaid],
  ];

  for (const [k, v] of entries) {
    if (k === lower) return v;
  }

  return undefined;
}
