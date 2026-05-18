import { expect, test } from '@playwright/test';

const storefront = (process.env.E2E_STOREFRONT_ORIGIN ?? 'http://127.0.0.1:5173').replace(/\/$/, '');

/** Storefront routes covered by visual regression snapshots. */
const ROUTES: { id: string; path: string }[] = [
  { id: 'catalog-home', path: '/' },
  { id: 'catalog-home-filtered', path: '/?page=0&brand=1&type=1' },
  { id: 'cart', path: '/cart' },
  { id: 'checkout', path: '/checkout' },
  { id: 'user-login', path: '/user/login' },
  { id: 'user-logout', path: '/user/logout' },
  { id: 'user-orders', path: '/user/orders' },
  { id: 'item-detail', path: '/item/1' },
  { id: 'auth-callback', path: '/auth/callback' },
];

const visualSuiteEnabled = process.env.E2E_RUN_VISUAL === '1';

test.describe('Storefront visual regression', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !visualSuiteEnabled,
      'Set E2E_RUN_VISUAL=1 with storefront reachable at E2E_STOREFRONT_ORIGIN (e.g. pnpm --filter @eshop/storefront-web build && vite preview --port 5173).',
    );
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  for (const { id, path } of ROUTES) {
    test(`${id}: ${path}`, async ({ page }) => {
      await page.goto(`${storefront}${path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.locator('main').waitFor({ state: 'visible', timeout: 30_000 });
      await expect(page).toHaveScreenshot(`${id}.png`, { fullPage: true });
    });
  }
});
