import { expect, test } from '@playwright/test';

import {
  catalogOrigin,
  e2eIdentityPassword,
  e2eIdentityUser,
  e2eRunCheckout,
  identityOrigin,
  orderingOrigin,
  storefrontOrigin,
} from '../helpers/env';
import { parseJwtSub } from '../helpers/jwt';
import { probeAll, type ServiceProbe } from '../helpers/service-probe';

const storefront = storefrontOrigin();

const coreStack: ServiceProbe[] = [
  { name: 'storefront', baseUrl: storefront, path: '/' },
  { name: 'identity', baseUrl: identityOrigin(), path: '/api/alive' },
  { name: 'catalog', baseUrl: catalogOrigin(), path: '/api/alive' },
];

const checkoutStack: ServiceProbe[] = [
  ...coreStack,
  { name: 'ordering', baseUrl: orderingOrigin(), path: '/api/alive' },
];

test.describe('Storefront journey (catalog, JWT login, cart)', () => {
  let skipReason: string | null = null;

  test.beforeAll(async ({ request }) => {
    const { ok, missing } = await probeAll(request, coreStack);
    if (!ok) {
      skipReason = `Skipped: stack not reachable — start storefront + identity + catalog (missing: ${missing.join(', ')}). See tests/e2e/README.md.`;
    }
  });

  test.beforeEach(() => {
    test.skip(!!skipReason, skipReason ?? undefined);
  });

  test.use({ baseURL: storefront });

  test('catalog home lists products', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.locator('main').waitFor({ state: 'visible', timeout: 30_000 });
    await expect(page.locator('.catalog-item').first()).toBeVisible({ timeout: 30_000 });
  });

  test('identity JWT login and session', async ({ page }) => {
    await page.goto('/user/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('User name').fill(e2eIdentityUser());
    await page.getByLabel('Password').fill(e2eIdentityPassword());
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/user\/login/, { timeout: 30_000 });
    await expect(page.locator('.eshop-user-menu-name')).toBeVisible({ timeout: 15_000 });
  });

  test('add item to cart after login', async ({ page }) => {
    await page.goto('/user/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('User name').fill(e2eIdentityUser());
    await page.getByLabel('Password').fill(e2eIdentityPassword());
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/user\/login/, { timeout: 30_000 });

    await page.goto('/item/1', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await page.goto('/cart');
    await expect(page.locator('.cart-item').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'cart' })).toBeVisible();
  });
});

test.describe('Checkout draft order (ordering API)', () => {
  let skipReason: string | null = null;

  test.beforeAll(async ({ request }) => {
    if (!e2eRunCheckout()) {
      skipReason =
        'Skipped: set E2E_RUN_CHECKOUT=1 with full stack (storefront, identity, catalog, ordering) to exercise POST /api/orders/draft.';
      return;
    }
    const { ok, missing } = await probeAll(request, checkoutStack);
    if (!ok) {
      skipReason = `Skipped: checkout stack not reachable (missing: ${missing.join(', ')}).`;
    }
  });

  test.beforeEach(() => {
    test.skip(!!skipReason, skipReason ?? undefined);
  });

  test.use({ baseURL: storefront });

  test('POST draft after login with cart line', async ({ page, request }) => {
    await page.goto('/user/login');
    await page.getByLabel('User name').fill(e2eIdentityUser());
    await page.getByLabel('Password').fill(e2eIdentityPassword());
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/user\/login/, { timeout: 30_000 });

    const jwt = await page.evaluate(() => {
      const keys = ['eshop_storefront_jwt_persistent', 'eshop_storefront_jwt'];
      for (const k of keys) {
        const v = localStorage.getItem(k) ?? sessionStorage.getItem(k);
        if (v?.trim().length) return v.trim();
      }
      return '';
    });
    expect(jwt.length).toBeGreaterThan(10);

    const buyerId = parseJwtSub(jwt);
    expect(buyerId).toBeTruthy();

    const catalogRes = await request.get(`${catalogOrigin()}/api/catalog/items/1`);
    expect(catalogRes.ok()).toBeTruthy();
    const item = (await catalogRes.json()) as {
      name?: string;
      Name?: string;
      price?: number;
      Price?: number;
    };
    const productName = String(item.name ?? item.Name ?? 'Product');
    const unitPrice = Number(item.price ?? item.Price ?? 0);

    const draftRes = await request.post(`${orderingOrigin()}/api/orders/draft`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      data: {
        buyerId,
        items: [
          {
            productId: 1,
            productName,
            unitPrice,
            pictureUrl: '/images/catalog/1.png',
            quantity: 1,
          },
        ],
      },
    });
    expect(draftRes.ok(), `draft failed: ${String(draftRes.status())} ${await draftRes.text()}`).toBeTruthy();
  });
});
