import { catalogItemPicUrl, fetchCatalogItemById } from '../../lib/catalog-api';
import type { BasketItemWire } from '../../lib/basket-api';
import type { CartLine, CartState } from './cart-reducer';

export async function enrichBasketItems(items: BasketItemWire[]): Promise<CartState> {
  const state: CartState = {};
  await Promise.all(
    items.map(async (wire) => {
      if (!wire.productId || wire.quantity < 1) return;
      try {
        const item = await fetchCatalogItemById(wire.productId);
        state[wire.productId] = {
          productId: wire.productId,
          productName: item.Name,
          unitPrice: item.Price,
          quantity: wire.quantity,
          pictureUrl: catalogItemPicUrl(wire.productId),
        };
      } catch {
        state[wire.productId] = {
          productId: wire.productId,
          productName: `Product #${String(wire.productId)}`,
          unitPrice: 0,
          quantity: wire.quantity,
          pictureUrl: catalogItemPicUrl(wire.productId),
        };
      }
    }),
  );
  return state;
}

export function cartStateToBasketItems(state: CartState): BasketItemWire[] {
  return Object.values(state).map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));
}

export function mergeCartLine(state: CartState, line: CartLine): CartState {
  return { ...state, [line.productId]: line };
}
