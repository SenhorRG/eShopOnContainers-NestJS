import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import { useIsAuthenticated } from '../../lib/use-access-token';
import type { BasketSyncStatus } from './basket-sync-status';
import { cartReducer, type CartAction, type CartLine, type CartState } from './cart-reducer';
import { useCartBasketSync } from './use-cart-basket-sync';

const STORAGE_KEY = 'eshop_storefront_cart_v1';
const GUEST_CART_ENV =
  (import.meta.env.VITE_ESHOP_CART_GUEST_MODE as string | undefined)?.toLowerCase() === 'true';

type CartContextValue = {
  state: CartState;
  dispatch: Dispatch<CartAction>;
  lines: CartLine[];
  totalQuantity: number;
  totalPrice: number;
  basketSync: BasketSyncStatus;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadInitial(): CartState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CartState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const authenticated = useIsAuthenticated();
  const guestMode = GUEST_CART_ENV || !authenticated;
  const [state, dispatch] = useReducer(cartReducer, {}, () =>
    guestMode ? loadInitial() : {},
  );

  const basketSync = useCartBasketSync({ state, dispatch, guestMode });

  useEffect(() => {
    if (!guestMode) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, guestMode]);

  const lines = useMemo(() => Object.values(state), [state]);
  const totalQuantity = useMemo(() => lines.reduce((a, l) => a + l.quantity, 0), [lines]);
  const totalPrice = useMemo(() => lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      lines,
      totalQuantity,
      totalPrice,
      basketSync,
    }),
    [state, dispatch, lines, totalQuantity, totalPrice, basketSync],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
