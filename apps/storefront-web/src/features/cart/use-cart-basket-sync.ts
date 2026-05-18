import { useEffect, useRef, useState, type Dispatch } from 'react';

import { deleteBasket, fetchBasket, putBasket } from '../../lib/basket-api';
import { useAccessToken, useIsAuthenticated } from '../../lib/use-access-token';
import { cartStateToBasketItems, enrichBasketItems } from './cart-basket-enrich';
import type { BasketSyncStatus } from './basket-sync-status';
import type { CartAction, CartState } from './cart-reducer';

const SYNC_DEBOUNCE_MS = 400;

type Params = {
  state: CartState;
  dispatch: Dispatch<CartAction>;
  guestMode: boolean;
};

export function useCartBasketSync({ state, dispatch, guestMode }: Params): BasketSyncStatus {
  const token = useAccessToken();
  const authenticated = useIsAuthenticated();
  const hydratedRef = useRef(false);
  const skipNextPushRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<BasketSyncStatus>(guestMode ? 'guest' : 'loading');

  useEffect(() => {
    if (guestMode) {
      setStatus('guest');
    }
  }, [guestMode]);

  useEffect(() => {
    if (guestMode || !authenticated || !token) {
      hydratedRef.current = false;
      if (!guestMode && authenticated && !token) {
        setStatus('loading');
      }
      return;
    }

    setStatus('loading');

    let cancelled = false;
    hydratedRef.current = false;

    void (async () => {
      try {
        const items = await fetchBasket(token);
        if (cancelled) return;
        const next = await enrichBasketItems(items);
        if (cancelled) return;
        skipNextPushRef.current = true;
        dispatch({ type: 'replace', state: next });
        hydratedRef.current = true;
        setStatus('synced');
      } catch {
        hydratedRef.current = true;
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated, token, guestMode, dispatch]);

  useEffect(() => {
    if (guestMode || !authenticated || !token || !hydratedRef.current) return;

    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const items = cartStateToBasketItems(state);
      void putBasket(token, items)
        .then(() => setStatus('synced'))
        .catch(() => {
          setStatus('error');
        });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state, authenticated, token, guestMode]);

  useEffect(() => {
    if (guestMode || !authenticated || !token) return;
    if (Object.keys(state).length > 0) return;
    if (!hydratedRef.current) return;
    void deleteBasket(token).catch(() => undefined);
  }, [state, authenticated, token, guestMode]);

  return status;
}
