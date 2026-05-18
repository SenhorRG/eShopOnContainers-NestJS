import { expect, test } from '@playwright/test';

const webhookUi = process.env.E2E_WEBHOOK_CLIENT_ORIGIN ?? 'http://127.0.0.1:5174';

/** HTTP probe only — avoids launching Chromium when the Vite app is down (CI-friendly). */
test('webhook-client dev server serves index when running', async ({ request }) => {
  const res = await request.get(webhookUi, { timeout: 8000 }).catch(() => null);
  if (!res?.ok()) {
    test.skip(true, `webhook-client not reachable at ${webhookUi} — run pnpm dev:ui`);
    return;
  }
  const html = await res.text();
  expect(html).toMatch(/webhook|eshop/i);
});
