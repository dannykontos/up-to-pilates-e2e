import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';

/**
 * Google Analytics must wait for consent (GDPR): no request to Google and no
 * _ga cookie until the visitor clicks "Acceptă" / "Accept" in the Complianz
 * banner. Uses page.goto directly, because BasePage.goto accepts the banner.
 */
test.describe('Google Analytics consent', () => {
  for (const path of [routes.ro.home, routes.en.home]) {
    test(`nothing is sent to Google before a choice is made: ${path}`, async ({ page, cookieBanner }) => {
      const analytics = cookieBanner.recordAnalyticsRequests();
      await page.goto(path);
      await expect(cookieBanner.acceptButton).toBeVisible();
      await page.waitForLoadState('networkidle');

      expect(analytics, 'no Google Analytics request before consent').toEqual([]);
      expect(await cookieBanner.analyticsCookies()).toEqual([]);
    });
  }

  test('after "Refuză", Google Analytics stays off on the next page too', async ({ page, cookieBanner }) => {
    const analytics = cookieBanner.recordAnalyticsRequests();
    await page.goto(routes.ro.home);
    await cookieBanner.denyButton.click();
    await expect(cookieBanner.root).toBeHidden();

    await page.goto(routes.ro.faq);
    await page.waitForLoadState('networkidle');

    expect(analytics).toEqual([]);
    expect(await cookieBanner.analyticsCookies()).toEqual([]);
  });

  test('after "Acceptă", Google Analytics starts and sets its cookie', async ({ page, cookieBanner }) => {
    const analytics = cookieBanner.recordAnalyticsRequests();
    await page.goto(routes.ro.home);
    await cookieBanner.acceptButton.click();

    await expect.poll(() => analytics.length, { timeout: 15_000 }).toBeGreaterThan(0);
    await expect.poll(() => cookieBanner.analyticsCookies(), { timeout: 15_000 }).toContain('_ga');
  });
});
