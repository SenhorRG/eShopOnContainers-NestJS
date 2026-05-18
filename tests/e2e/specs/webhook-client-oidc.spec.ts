import { expect, test } from '@playwright/test';

import { origin } from '../helpers/env';
import { fetchKeycloakPasswordToken, probeKeycloak } from '../helpers/keycloak';
import { probeAll, type ServiceProbe } from '../helpers/service-probe';

const webhookUi = () => origin('E2E_WEBHOOK_CLIENT_ORIGIN', 'http://127.0.0.1:5174');

const webhooksApi = () => origin('E2E_WEBHOOKS_ORIGIN', 'http://127.0.0.1:5055');

const WEBHOOK_JWT_KEY = 'eshop_webhook_demo_jwt';

const oidcStack: ServiceProbe[] = [
  { name: 'webhook-client', baseUrl: webhookUi(), path: '/' },
  { name: 'webhooks-api', baseUrl: webhooksApi(), path: '/api/alive' },
];

test.describe('Webhook client OIDC token @oidc', () => {
  let skipReason: string | null = null;

  test.beforeAll(async ({ request }) => {
    if (!process.env.E2E_OIDC_ENABLED?.trim()) {
      skipReason =
        'Skipped: set E2E_OIDC_ENABLED=1 with Keycloak and webhooks-service JWKS configured. See deploy/keycloak/README.md.';
      return;
    }
    const kcOk = await probeKeycloak(request);
    if (!kcOk) {
      skipReason = 'Skipped: Keycloak not reachable.';
      return;
    }
    const { ok, missing } = await probeAll(request, oidcStack);
    if (!ok) {
      skipReason = `Skipped: webhook OIDC stack not reachable (missing: ${missing.join(', ')}).`;
    }
  });

  test.beforeEach(() => {
    test.skip(!!skipReason, skipReason ?? undefined);
  });

  test('lists subscriptions with Keycloak bearer', async ({ page, request }) => {
    const token = await fetchKeycloakPasswordToken(request);

    await page.goto(webhookUi(), { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ({ key, value }) => {
        sessionStorage.setItem(key, value);
      },
      { key: WEBHOOK_JWT_KEY, value: token },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Registered webhooks' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.quickgrid, .grid-placeholder').first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
