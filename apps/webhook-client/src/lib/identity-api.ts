import { apiBase } from './env';

export type IdentityTokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
};

function identityBase(): string {
  return apiBase(import.meta.env.VITE_ESHOP_IDENTITY_ORIGIN, 'http://127.0.0.1:5051');
}

export async function loginWithPassword(email: string, password: string): Promise<IdentityTokenResponse> {
  const res = await fetch(`${identityBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Login failed (${String(res.status)})`);
  }
  return (await res.json()) as IdentityTokenResponse;
}
