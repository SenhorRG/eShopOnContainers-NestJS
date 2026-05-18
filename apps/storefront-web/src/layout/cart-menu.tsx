import { Link } from 'react-router-dom';

import { useCart } from '../features/cart/cart-context';

export function CartMenu() {
  const { totalQuantity } = useCart();
  const showBadge = totalQuantity > 0;

  return (
    <Link className="eshop-cart-link" aria-label="cart" to="/cart">
      <img role="presentation" src="/icons/cart.svg" alt="" />
      {showBadge ? <span className="cart-badge">{totalQuantity}</span> : null}
    </Link>
  );
}
