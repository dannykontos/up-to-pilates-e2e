import { defineConfig, devices } from '@playwright/test';
import { env } from './utils/env';

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

  // Responsive specs run only against the mobile projects below; the
  // desktop projects cover everything else (smoke, navigation, booking,
  // packages, contact, SEO).
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/responsive/**',
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/responsive/**',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/responsive/**',
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
