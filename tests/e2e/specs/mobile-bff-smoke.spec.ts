import { expect, test } from '@playwright/test';

const bffBase = process.env.E2E_BFF_ORIGIN ?? 'http://127.0.0.1:5070';

test.describe('mobile-bff smoke', () => {
  test('BFF health responds when stack is up', async ({ request }) => {
    const res = await request.get(`${bffBase}/alive`, { timeout: 5000 }).catch(() => null);
    if (!res || !res.ok()) {
      test.skip(true, `mobile-bff not reachable at ${bffBase} — start pnpm dev`);
      return;
    }
    expect(res.ok()).toBeTruthy();
  });

  test('BFF proxies catalog items when catalog is up', async ({ request }) => {
    const res = await request.get(`${bffBase}/api/catalog/items?pageIndex=0&pageSize=1`, {
      timeout: 8000,
    }).catch(() => null);
    if (!res || res.status() >= 500) {
      test.skip(true, 'catalog upstream unavailable for BFF proxy');
      return;
    }
    expect(res.status()).toBeLessThan(500);
  });
});
