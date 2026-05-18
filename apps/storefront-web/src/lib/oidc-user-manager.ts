import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

let manager: UserManager | undefined;

/** Distinct from dotnet/eShop OIDC keys if both stacks are used on the same machine. */
const OIDC_WEB_STORAGE_PREFIX = 'eshop_nest_storefront_oidc_';

function authorityUrl(): string {
  return (import.meta.env.VITE_ESHOP_AUTHORITY as string | undefined)?.replace(/\/$/, '') ?? '';
}

export function isOidcConfigured(): boolean {
  return authorityUrl().length > 0;
}

function redirectUri(): string {
  const base = import.meta.env.BASE_URL || '/';
  return new URL('auth/callback', `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}`).href;
}

function postLogoutUri(): string {
  const base = import.meta.env.BASE_URL || '/';
  return new URL('/', `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}`).href;
}

export function getUserManager(): UserManager | undefined {
  if (!isOidcConfigured() || typeof window === 'undefined') return undefined;
  if (manager) return manager;
  const settings: UserManagerSettings = {
    authority: authorityUrl(),
    client_id: (import.meta.env.VITE_ESHOP_CLIENT_ID as string | undefined) ?? 'webapp',
    redirect_uri: redirectUri(),
    post_logout_redirect_uri: postLogoutUri(),
    response_type: 'code',
    scope: 'openid profile orders basket',
    userStore: new WebStorageStateStore({
      store: window.sessionStorage,
      prefix: OIDC_WEB_STORAGE_PREFIX,
    }),
    stateStore: new WebStorageStateStore({
      store: window.sessionStorage,
      prefix: OIDC_WEB_STORAGE_PREFIX,
    }),
    automaticSilentRenew: false,
  };
  manager = new UserManager(settings);
  return manager;
}
