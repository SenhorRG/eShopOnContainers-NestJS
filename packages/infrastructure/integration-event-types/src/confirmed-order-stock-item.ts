import type { IntegrationJson } from '@eshop/event-bus-amqp';

export interface ConfirmedOrderStockItemPayload {
  ProductId: number;
  HasStock: boolean;
}

export function reviveConfirmedItems(arr: IntegrationJson[]): ConfirmedOrderStockItemPayload[] {
  return arr.map((row) =>
    reviveConfirmedItem(row),
  );
}

export function reviveConfirmedItem(json: IntegrationJson): ConfirmedOrderStockItemPayload {
  const j = json as { ProductId?: number; HasStock?: boolean; productId?: number; hasStock?: boolean };
  return {
    ProductId: Number(j.ProductId ?? j.productId),
    HasStock: Boolean(j.HasStock ?? j.hasStock),
  };
}
