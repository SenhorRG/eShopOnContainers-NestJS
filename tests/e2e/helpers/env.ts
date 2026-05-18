export function origin(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  return (raw?.length ? raw : fallback).replace(/\/$/, '');
}

export const storefrontOrigin = () =>
  origin('E2E_STOREFRONT_ORIGIN', 'http://127.0.0.1:5173');

export const identityOrigin = () =>
  origin('E2E_IDENTITY_ORIGIN', 'http://127.0.0.1:5051');

export const catalogOrigin = () =>
  origin('E2E_CATALOG_ORIGIN', 'http://127.0.0.1:5052');

export const orderingOrigin = () =>
  origin('E2E_ORDERING_ORIGIN', 'http://127.0.0.1:5053');

export const e2eIdentityUser = () => process.env.E2E_IDENTITY_USER?.trim() || 'alice';

export const e2eIdentityPassword = () =>
  process.env.E2E_IDENTITY_PASSWORD?.trim() || 'Pass123$';

export const e2eRunCheckout = () => process.env.E2E_RUN_CHECKOUT === '1';
