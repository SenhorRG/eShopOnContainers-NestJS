export const WEBHOOK_CLIENT_JWT_KEY = 'eshop_webhook_demo_jwt';

export function readWebhookJwt(): string {
  try {
    return sessionStorage.getItem(WEBHOOK_CLIENT_JWT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeWebhookJwt(value: string): void {
  try {
    if (value.trim().length) sessionStorage.setItem(WEBHOOK_CLIENT_JWT_KEY, value.trim());
    else sessionStorage.removeItem(WEBHOOK_CLIENT_JWT_KEY);
  } catch {
    /* ignore */
  }
}

export function clearWebhookJwt(): void {
  try {
    sessionStorage.removeItem(WEBHOOK_CLIENT_JWT_KEY);
  } catch {
    /* ignore */
  }
}
