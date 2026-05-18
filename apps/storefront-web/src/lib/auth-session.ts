import type { User } from 'oidc-client-ts';

import { isJwtExpired, parseJwtSub } from './jwt-parse';

export function accessTokenFromSession(jwt: string, oidcUser: User | null | undefined): string | null {
  const manual = jwt.trim();
  if (manual.length) {
    if (isJwtExpired(manual)) return null;
    return manual;
  }
  const oidc = oidcUser?.access_token?.trim();
  if (oidc?.length) {
    if (isJwtExpired(oidc)) return null;
    return oidc;
  }
  return null;
}

export function buyerSubFromSession(jwt: string, oidcUser: User | null | undefined): string {
  const fromJwt = jwt.trim().length ? parseJwtSub(jwt) : null;
  if (fromJwt) return fromJwt;
  const sub = oidcUser?.profile?.sub;
  return sub != null ? String(sub) : '';
}

export function isAuthenticatedSession(jwt: string, oidcUser: User | null | undefined): boolean {
  return accessTokenFromSession(jwt, oidcUser) != null;
}
