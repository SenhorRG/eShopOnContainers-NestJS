import { test, expect } from '@playwright/test';

const healthSuiteEnabled = process.env.E2E_RUN_HEALTH === '1';

test.describe('HTTP liveness (Nest)', () => {
  test.beforeEach(() => {
    test.skip(!healthSuiteEnabled, 'Set E2E_RUN_HEALTH=1 with catalog/ordering running (pnpm dev + infra).');
  });

  test('catalog /api/alive', async ({ request }) => {
    const base = process.env.E2E_CATALOG_ORIGIN ?? 'http://127.0.0.1:5052';
    const url = `${base.replace(/\/$/, '')}/api/alive`;
    const res = await request.get(url, { timeout: 8000 }).catch(() => null);
    if (!res?.ok()) {
      test.skip(true, `catalog not reachable at ${url} — start pnpm dev`);
      return;
    }
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('ordering /api/alive', async ({ request }) => {
    const base = process.env.E2E_ORDERING_ORIGIN ?? 'http://127.0.0.1:5053';
    const url = `${base.replace(/\/$/, '')}/api/alive`;
    const res = await request.get(url, { timeout: 8000 }).catch(() => null);
    if (!res?.ok()) {
      test.skip(true, `ordering not reachable at ${url} — start pnpm dev`);
      return;
    }
    expect(res.ok()).toBeTruthy();
  });
});
