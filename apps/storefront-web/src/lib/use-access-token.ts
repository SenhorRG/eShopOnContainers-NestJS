import { useStorefrontUi } from '../layout/storefront-ui-context';
import { accessTokenFromSession, buyerSubFromSession, isAuthenticatedSession } from './auth-session';
import { useOidcUser } from './use-oidc-user';

export function useAccessToken(): string | null {
  const { jwt } = useStorefrontUi();
  const oidcUser = useOidcUser();
  return accessTokenFromSession(jwt, oidcUser);
}

export function useBuyerSub(): string {
  const { jwt } = useStorefrontUi();
  const oidcUser = useOidcUser();
  return buyerSubFromSession(jwt, oidcUser);
}

export function useIsAuthenticated(): boolean {
  const { jwt } = useStorefrontUi();
  const oidcUser = useOidcUser();
  return isAuthenticatedSession(jwt, oidcUser);
}
