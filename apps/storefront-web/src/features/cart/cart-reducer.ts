import { catalogItemPicUrl } from '../../lib/catalog-api';
import type { CatalogItemVm } from '../../lib/catalog-types';

export type CartLine = {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  pictureUrl: string;
};

export type CartState = Record<number, CartLine>;

export type CartAction =
  | { type: 'add'; item: CatalogItemVm }
  | { type: 'inc'; productId: number }
  | { type: 'dec'; productId: number }
  | { type: 'remove'; productId: number }
  | { type: 'setQty'; productId: number; quantity: number }
  | { type: 'clear' }
  | { type: 'replace'; state: CartState };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const id = action.item.Id;
      const prev = state[id];
      const pictureUrl = catalogItemPicUrl(id);
      const line: CartLine = prev
        ? { ...prev, quantity: prev.quantity + 1 }
        : {
            productId: id,
            productName: action.item.Name,
            unitPrice: action.item.Price,
            quantity: 1,
            pictureUrl,
          };
      return { ...state, [id]: line };
    }
    case 'inc': {
      const prev = state[action.productId];
      if (!prev) return state;
      return {
        ...state,
        [action.productId]: { ...prev, quantity: prev.quantity + 1 },
      };
    }
    case 'dec': {
      const prev = state[action.productId];
      if (!prev) return state;
      if (prev.quantity <= 1) {
        const next = { ...state };
        delete next[action.productId];
        return next;
      }
      return {
        ...state,
        [action.productId]: { ...prev, quantity: prev.quantity - 1 },
      };
    }
    case 'remove': {
      const next = { ...state };
      delete next[action.productId];
      return next;
    }
    case 'setQty': {
      const prev = state[action.productId];
      if (!prev) return state;
      const q = Math.max(0, Math.floor(action.quantity));
      if (q === 0) {
        const next = { ...state };
        delete next[action.productId];
        return next;
      }
      return { ...state, [action.productId]: { ...prev, quantity: q } };
    }
    case 'clear':
      return {};
    case 'replace':
      return action.state;
    default:
      return state;
  }
}
