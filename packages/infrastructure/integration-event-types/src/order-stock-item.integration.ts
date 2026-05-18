import type { IntegrationJson } from '@eshop/event-bus-amqp';

export interface OrderStockItemPayload {
  ProductId: number;
  Units: number;
}

export function reviveOrderStockItem(json: IntegrationJson): OrderStockItemPayload {
  return {
    ProductId: Number(json.ProductId ?? (json as { productId?: number }).productId),
    Units: Number(json.Units ?? (json as { units?: number }).units),
  };
}
