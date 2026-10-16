import { defineConfig, devices } from '@playwright/test';
import { env } from './utils/env';

/** Specs that only use the `request` fixture and never open a browser page. */
const HTTP_ONLY_SPECS = ['**/seo/**', '**/performance/**'];

/** Specs whose result does not depend on the browser engine, so Chromium alone is enough. */
const CHROMIUM_ONLY_SPECS = ['**/accessibility/**'];

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * All environment-specific values (base URL, feature flags) live in
 * utils/env.ts, which reads from process.env - nothing is hardcoded here
 * and no secrets are required to run the suite.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Responsive specs run only against the mobile projects below. SEO and
  // performance specs only make HTTP requests (no page is rendered), so
  // they run once on the "http" project instead of once per browser. The
  // desktop browser projects cover everything else (smoke, navigation,
  // booking, packages, contact, journal, campaigns).
  projects: [
    {
      name: 'http',
      testMatch: HTTP_ONLY_SPECS,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/responsive/**', ...HTTP_ONLY_SPECS],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/responsive/**', ...HTTP_ONLY_SPECS, ...CHROMIUM_ONLY_SPECS],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/responsive/**', ...HTTP_ONLY_SPECS, ...CHROMIUM_ONLY_SPECS],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
      testDir: './tests/responsive',
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
      testDir: './tests/responsive',
    },
  ],
});
