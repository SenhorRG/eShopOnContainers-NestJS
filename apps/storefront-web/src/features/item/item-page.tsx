import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useCart } from '../cart/cart-context';
import { catalogItemPicUrl, fetchCatalogItemById } from '../../lib/catalog-api';
import type { CatalogItemVm } from '../../lib/catalog-types';
import { useIsAuthenticated } from '../../lib/use-access-token';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

export function ItemPage() {
  const { itemId } = useParams();
  const id = itemId != null && /^[0-9]+$/.test(itemId) ? Number(itemId) : NaN;
  const navigate = useNavigate();
  const { dispatch, lines } = useCart();
  const { setHeaderTitle, setHeaderSubtitle } = useStorefrontUi();
  const isLoggedIn = useIsAuthenticated();

  const [item, setItem] = useState<CatalogItemVm | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);

  const numInCart = useMemo(() => {
    if (!Number.isFinite(id)) return 0;
    const line = lines.find((l) => l.productId === id);
    return line?.quantity ?? 0;
  }, [id, lines]);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setNotFound(true);
      setItem(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchCatalogItemById(id);
        if (!cancelled) {
          setItem(data);
          setNotFound(false);
          setHeaderTitle(data.Name);
          setHeaderSubtitle(data.CatalogBrand?.Brand ?? '');
        }
      } catch (e) {
        if ((e as Error).message === '404') {
          if (!cancelled) {
            setNotFound(true);
            setItem(null);
            setHeaderTitle('Not found');
            setHeaderSubtitle('');
          }
        } else if (!cancelled) {
          setNotFound(false);
          setItem(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, setHeaderSubtitle, setHeaderTitle]);

  useEffect(() => {
    if (item?.Name) document.title = `${item.Name} | AdventureWorks`;
    return () => {
      document.title = 'eShop Storefront';
    };
  }, [item?.Name]);

  useEffect(() => {
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderTitle, setHeaderSubtitle]);

  const maxQty = useMemo(() => {
    if (!item) return 1;
    if (item.AvailableStock == null) return 99;
    const cap = item.MaxStockThreshold ?? item.AvailableStock;
    return Math.max(1, Math.min(item.AvailableStock, cap));
  }, [item]);

  useEffect(() => {
    setQty((q) => Math.min(Math.max(1, q), maxQty));
  }, [maxQty]);

  const add = () => {
    if (!item) return;
    if (!isLoggedIn) {
      const ret = encodeURIComponent(`/item/${String(id)}`);
      void navigate(`/user/login?returnUrl=${ret}`);
      return;
    }
    for (let i = 0; i < qty; i += 1) {
      dispatch({ type: 'add', item });
    }
  };

  if (notFound) {
    return (
      <div className="eshop-item-page container">
        <div className="item-details">
          <p>Sorry, we couldn&apos;t find any such product.</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="eshop-item-page container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="eshop-item-page container">
      <div className="item-details">
        <div className="item-details__media">
          <img alt={item.Name} src={catalogItemPicUrl(item.Id)} width={400} height={400} decoding="async" />
        </div>
        <div className="description">
          <p>{item.Description}</p>
          <p>
            Brand: <strong>{item.CatalogBrand?.Brand ?? '—'}</strong>
          </p>
          <div className="add-to-cart">
            <span className="price">${item.Price.toFixed(2)}</span>
            <label htmlFor="qty" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Qty
              <input
                id="qty"
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
              />
            </label>
            <button type="button" title={isLoggedIn ? 'Add to basket' : 'Log in to purchase'} onClick={add}>
              {isLoggedIn ? 'Add to shopping bag' : 'Log in to purchase'}
            </button>
          </div>
          {numInCart > 0 ? (
            <p>
              <strong>{numInCart}</strong> in{' '}
              <Link to="/cart">shopping bag</Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
