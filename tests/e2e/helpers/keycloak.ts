import type { APIRequestContext } from '@playwright/test';

import { origin } from './env';

export const keycloakBaseUrl = () =>
  origin('E2E_KEYCLOAK_ORIGIN', 'http://127.0.0.1:8081');

export const keycloakRealmUrl = () => `${keycloakBaseUrl()}/realms/eshop`;

export const e2eOidcUser = () => process.env.E2E_OIDC_USER?.trim() || 'alice@example.com';

export const e2eOidcPassword = () => process.env.E2E_OIDC_PASSWORD?.trim() || 'Pass123$';

export const e2eOidcClientId = () => process.env.E2E_OIDC_CLIENT_ID?.trim() || 'webapp';

export async function probeKeycloak(request: APIRequestContext): Promise<boolean> {
  const url = `${keycloakRealmUrl()}/.well-known/openid-configuration`;
  try {
    const res = await request.get(url, { timeout: 8_000 });
    return res.ok();
  } catch {
    return false;
  }
}

export async function fetchKeycloakPasswordToken(
  request: APIRequestContext,
  clientId = e2eOidcClientId(),
): Promise<string> {
  const tokenUrl = `${keycloakRealmUrl()}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: e2eOidcUser(),
    password: e2eOidcPassword(),
  });
  const res = await request.post(tokenUrl, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: body.toString(),
  });
  if (!res.ok()) {
    throw new Error(`Keycloak token failed: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  const token = json.access_token?.trim();
  if (!token) throw new Error('Keycloak token response missing access_token');
  return token;
}
