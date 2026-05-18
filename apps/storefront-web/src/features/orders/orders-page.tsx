import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { OrderSummaryVm } from '../../lib/ordering-api';
import { fetchMyOrders } from '../../lib/ordering-api';
import { useAccessToken, useIsAuthenticated } from '../../lib/use-access-token';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

function formatOrdersError(message: string): string {
  if (message === 'orders_unauthorized') {
    return 'Your session is missing or was rejected by ordering-service. Sign out, sign in again (alice / Pass123$), then reopen this page.';
  }
  return message;
}

export function OrdersPage() {
  const { pathname, search } = useLocation();
  const loginHref = `/user/login?returnUrl=${encodeURIComponent(`${pathname}${search}`)}`;
  const { setHeaderTitle, setHeaderSubtitle, authHydrated, persistJwt } = useStorefrontUi();
  const token = useAccessToken();
  const isAuthenticated = useIsAuthenticated();
  const [orders, setOrders] = useState<OrderSummaryVm[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    if (!isAuthenticated || !token) {
      setOrders(null);
      setError(null);
      return;
    }
    try {
      const list = await fetchMyOrders(token);
      setOrders(list);
      setError(null);
    } catch (e) {
      const message = String((e as Error).message ?? e);
      if (message === 'orders_unauthorized') {
        persistJwt('');
      }
      setError(formatOrdersError(message));
      setOrders(null);
    }
  }, [authHydrated, isAuthenticated, token, persistJwt]);

  useEffect(() => {
    setHeaderTitle('Orders');
    setHeaderSubtitle('');
    document.title = 'Orders | AdventureWorks';
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderSubtitle, setHeaderTitle]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load(), 10_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="orders">
        {!authHydrated ? <p>Loading...</p> : null}
        {authHydrated && !isAuthenticated ? (
          <p>
            <Link to={loginHref}>Sign in</Link> to view your orders.
          </p>
        ) : null}
        {authHydrated && isAuthenticated && orders === null && !error ? <p>Loading...</p> : null}
        {error ? <p>{error}</p> : null}
        {orders && orders.length === 0 ? <p>You haven&apos;t yet placed any orders.</p> : null}
        {orders && orders.length > 0 ? (
          <ul className="orders-list">
            <li className="orders-header orders-item">
              <div>Number</div>
              <div>Date</div>
              <div className="total-header">Total</div>
              <div>Status</div>
            </li>
            {orders.map((o) => (
              <li className="orders-item" key={o.orderNumber}>
                <div className="order-number">{o.orderNumber}</div>
                <div className="order-date">{o.date}</div>
                <div className="order-total">${o.total.toFixed(2)}</div>
                <div className="order-status">
                  <span className={`status ${o.status.toLowerCase()}`}>{o.status}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          <Link to="/">Continue shopping</Link>
        </p>
    </div>
  );
}
