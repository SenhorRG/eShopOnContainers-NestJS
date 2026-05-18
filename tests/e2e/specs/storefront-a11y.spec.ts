import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const storefront = (process.env.E2E_STOREFRONT_ORIGIN ?? 'http://127.0.0.1:5173').replace(/\/$/, '');

const a11ySuiteEnabled = process.env.E2E_RUN_A11Y === '1';

test.describe('Storefront accessibility (axe)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !a11ySuiteEnabled,
      'Set E2E_RUN_A11Y=1 with storefront at E2E_STOREFRONT_ORIGIN (same as visual suite).',
    );
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('home: no serious or critical violations', async ({ page }) => {
    await page.goto(`${storefront}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.locator('main').waitFor({ state: 'visible', timeout: 30_000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .disableRules(['color-contrast'])
      .analyze();
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect.soft(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });
});
