import { describe, expect, it } from 'vitest';

import { WebhookType, parseWebhookTypeFromEventString } from './webhook-type';

describe('parseWebhookTypeFromEventString', () => {
  it('parses case-insensitive enum names', () => {
    expect(parseWebhookTypeFromEventString('OrderPaid')).toBe(WebhookType.OrderPaid);
    expect(parseWebhookTypeFromEventString('orderpaid')).toBe(WebhookType.OrderPaid);
    expect(parseWebhookTypeFromEventString('CatalogItemPriceChange')).toBe(
      WebhookType.CatalogItemPriceChange,
    );
    expect(parseWebhookTypeFromEventString('bad')).toBeUndefined();
  });
});
