import { defineConfig, devices } from '@playwright/test';

const catalogBase = process.env.E2E_CATALOG_ORIGIN ?? 'http://127.0.0.1:5052';
const orderingBase = process.env.E2E_ORDERING_ORIGIN ?? 'http://127.0.0.1:5053';
const storefrontBase = process.env.E2E_STOREFRONT_ORIGIN ?? 'http://127.0.0.1:5173';

const crossBrowser = process.env.E2E_CROSS_BROWSER === '1';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['github'],
        ['line'],
      ]
    : 'list',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixels: 1500,
      threshold: 0.25,
    },
  },
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    baseURL: catalogBase,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(crossBrowser
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  metadata: {
    catalogBase,
    orderingBase,
    storefrontBase,
  },
});
