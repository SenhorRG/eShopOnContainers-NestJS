const DEV_LOGIN_EMAIL_KEY = 'VITE_ESHOP_DEV_LOGIN_EMAIL';

export function readDevLoginEmail(): string {
  const raw = import.meta.env[DEV_LOGIN_EMAIL_KEY];
  return typeof raw === 'string' ? raw.trim() : '';
}
