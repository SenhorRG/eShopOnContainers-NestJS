import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useCart } from '../cart/cart-context';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

export function CartPage() {
  const { lines, dispatch, totalQuantity, totalPrice, basketSync } = useCart();
  const { setHeaderTitle, setHeaderSubtitle } = useStorefrontUi();
  const [draftQty, setDraftQty] = useState<Record<number, string>>({});

  useEffect(() => {
    setHeaderTitle('Shopping bag');
    setHeaderSubtitle('');
    document.title = 'Shopping Bag | AdventureWorks';
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderSubtitle, setHeaderTitle]);

  if (!lines.length) {
    return (
      <div className="cart">
        <p>
          Your shopping bag is empty.{' '}
          <Link to="/">Continue shopping.</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="cart cart--with-sync">
      {basketSync === 'synced' ? (
        <p className="cart-sync-hint" role="status">
          Cart synced with your account (basket-service via BFF).
        </p>
      ) : null}
      {basketSync === 'error' ? (
        <p className="cart-sync-hint cart-sync-hint--warn" role="status">
          Could not sync cart with the server; changes are kept locally until the next successful sync.
        </p>
      ) : null}
      <div className="cart-items">
        <div className="cart-item-header">
          <div className="catalog-item-info">Products</div>
          <div className="catalog-item-quantity">Quantity</div>
          <div className="catalog-item-total">Total</div>
        </div>
        {lines.map((item) => (
          <div className="cart-item" key={item.productId}>
            <div className="catalog-item-info">
              <img alt={item.productName} src={item.pictureUrl} />
              <div className="catalog-item-content">
                <p className="name">{item.productName}</p>
                <p className="price">${item.unitPrice.toFixed(2)}</p>
              </div>
            </div>
            <div className="catalog-item-quantity">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const raw = draftQty[item.productId] ?? String(item.quantity);
                  const n = Math.max(0, Math.floor(Number(raw) || 0));
                  dispatch({ type: 'setQty', productId: item.productId, quantity: n });
                }}
              >
                <input
                  aria-label="product quantity"
                  type="number"
                  min={0}
                  value={draftQty[item.productId] ?? String(item.quantity)}
                  onChange={(e) =>
                    setDraftQty((d) => ({ ...d, [item.productId]: e.target.value }))
                  }
                />
                <button type="submit" className="button button-secondary">
                  Update
                </button>
              </form>
            </div>
            <div className="catalog-item-total">${(item.unitPrice * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="cart-summary-container">
          <div className="cart-summary-header">
            <img role="presentation" src="/icons/cart.svg" alt="" />
            Your shopping bag
            <span className="filter-badge">{totalQuantity}</span>
          </div>
          <div className="cart-summary-total">
            <div>Total</div>
            <div>${totalPrice.toFixed(2)}</div>
          </div>
          <Link to="/checkout" className="button button-primary">
            Check out
          </Link>
          <Link to="/" className="cart-summary-link">
            <img role="presentation" src="/icons/arrow-left.svg" alt="" />
            <p>Continue shopping</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
