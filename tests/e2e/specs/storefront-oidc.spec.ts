import { expect, test } from '@playwright/test';

import { catalogOrigin, storefrontOrigin } from '../helpers/env';
import {
  e2eOidcPassword,
  e2eOidcUser,
  probeKeycloak,
} from '../helpers/keycloak';
import { probeAll, type ServiceProbe } from '../helpers/service-probe';

const storefront = storefrontOrigin();

const oidcStack: ServiceProbe[] = [
  { name: 'storefront', baseUrl: storefront, path: '/' },
  { name: 'catalog', baseUrl: catalogOrigin(), path: '/api/alive' },
];

test.describe('Storefront OIDC @oidc', () => {
  let skipReason: string | null = null;

  test.beforeAll(async ({ request }) => {
    if (!process.env.E2E_OIDC_ENABLED?.trim()) {
      skipReason =
        'Skipped: set E2E_OIDC_ENABLED=1 with Keycloak, storefront (VITE_ESHOP_AUTHORITY), and catalog running. See deploy/keycloak/README.md.';
      return;
    }
    const kcOk = await probeKeycloak(request);
    if (!kcOk) {
      skipReason = 'Skipped: Keycloak realm not reachable at E2E_KEYCLOAK_ORIGIN (default http://127.0.0.1:8081).';
      return;
    }
    const { ok, missing } = await probeAll(request, oidcStack);
    if (!ok) {
      skipReason = `Skipped: OIDC stack not reachable (missing: ${missing.join(', ')}).`;
    }
  });

  test.beforeEach(() => {
    test.skip(!!skipReason, skipReason ?? undefined);
  });

  test.use({ baseURL: storefront });

  test('Keycloak login and catalog browse', async ({ page }) => {
    await page.goto('/user/login/oidc?returnUrl=/', { waitUntil: 'domcontentloaded' });

    const keycloakLogin = page.locator('#kc-login, input[name="username"]').first();
    await keycloakLogin.waitFor({ state: 'visible', timeout: 45_000 });

    await page.locator('input[name="username"], #username').fill(e2eOidcUser());
    await page.locator('input[name="password"], #password').fill(e2eOidcPassword());
    await page.locator('input[type="submit"], button[type="submit"], #kc-login').first().click();

    await expect(page).toHaveURL(new RegExp(`${storefront.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), {
      timeout: 60_000,
    });
    await expect(page.locator('.eshop-user-menu-name')).toBeVisible({ timeout: 30_000 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.catalog-item').first()).toBeVisible({ timeout: 30_000 });
  });
});
