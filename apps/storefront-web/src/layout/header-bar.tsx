import { Link, useLocation } from 'react-router-dom';

import { CartMenu } from './cart-menu';
import { UserMenu } from './user-menu';
import { useStorefrontUi } from './storefront-ui-context';

export function HeaderBar() {
  const { pathname } = useLocation();
  const isCatalog = pathname === '/' || pathname === '';
  const { headerTitle, headerSubtitle } = useStorefrontUi();
  const headerImage = isCatalog ? '/images/header-home.webp' : '/images/header.webp';

  return (
    <header className={`eshop-header ${isCatalog ? 'home' : ''}`}>
      <div className="eshop-header-hero">
        <img role="presentation" src={headerImage} alt="" />
      </div>
      <div className="eshop-header-container">
        <nav className="eshop-header-navbar" aria-label="Primary">
          <Link className="logo logo-header" to="/">
            <img alt="AdventureWorks" src="/images/logo-header.svg" className="logo logo-header" />
          </Link>
          <UserMenu />
          <CartMenu />
        </nav>
        <div className="eshop-header-intro">
          <h1>{headerTitle}</h1>
          <p>{headerSubtitle}</p>
        </div>
      </div>
    </header>
  );
}
