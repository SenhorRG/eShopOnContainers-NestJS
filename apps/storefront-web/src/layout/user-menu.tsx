import { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { parseJwtDisplayName } from '../lib/jwt-parse';
import { isAuthenticatedSession } from '../lib/auth-session';
import { useOidcUser } from '../lib/use-oidc-user';
import { useStorefrontUi } from './storefront-ui-context';

export function UserMenu() {
  const { jwt } = useStorefrontUi();
  const oidcUser = useOidcUser();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const authorized = isAuthenticatedSession(jwt, oidcUser);
  const displayName =
    parseJwtDisplayName(jwt) ??
    (oidcUser?.profile?.name as string | undefined) ??
    (oidcUser?.profile?.preferred_username as string | undefined) ??
    null;

  const logOut = () => {
    void navigate('/user/logout');
  };

  const loginHref = `/user/login?returnUrl=${encodeURIComponent(`${pathname}${search}`)}`;

  if (!authorized) {
    return (
      <Link aria-label="Sign in" to={loginHref}>
        <img role="presentation" src="/icons/user.svg" alt="" />
      </Link>
    );
  }

  return (
    <Fragment>
      <h3 className="eshop-user-menu-name">{displayName ?? 'Signed in'}</h3>
      <div className="dropdown-menu">
        <span className="dropdown-button">
          <img role="presentation" src="/icons/user.svg" alt="" />
        </span>
        <div className="dropdown-content">
          <Link className="dropdown-item" to="/user/orders">
            My orders
          </Link>
          <div className="dropdown-item">
            <button type="button" onClick={logOut}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
