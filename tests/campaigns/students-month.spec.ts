import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';

/**
 * Students Month campaign (1-31 October 2026, code STUDENTS25OFF).
 *
 * The header announcement bar removes itself from 1 November, so its tests
 * pin the browser clock instead of depending on today's date. Delete this
 * spec when the campaign is cleaned up after 1 November (homepage banners
 * and the bar's HTML removed, offer pages switched to "back next year").
 */
const DURING_CAMPAIGN = new Date('2026-10-20T12:00:00+03:00');
const AFTER_CAMPAIGN = new Date('2026-11-01T00:00:00+02:00');
const DISCOUNT_CODE = 'STUDENTS25OFF';

const locales = [
  { lang: 'RO', home: routes.ro.home, offer: routes.ro.studentsMonth, booking: routes.ro.booking },
  { lang: 'EN', home: routes.en.home, offer: routes.en.studentsMonth, booking: routes.en.booking },
];

test.describe('Students Month campaign', () => {
  for (const { lang, home, offer, booking } of locales) {
    test(`announcement bar links to the offer during October (${lang})`, async ({ page, homePage }) => {
      await page.clock.setFixedTime(DURING_CAMPAIGN);
      await homePage.goto(home);

      const bar = page.locator('.upt-announce');
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('link')).toHaveAttribute('href', offer);
    });

    test(`announcement bar disappears from 1 November (${lang})`, async ({ page, homePage }) => {
      await page.clock.setFixedTime(AFTER_CAMPAIGN);
      await homePage.goto(home);

      await expect(page.locator('.upt-announce')).toHaveCount(0);
    });

    test(`announcement bar is hidden on the offer page itself (${lang})`, async ({ page, homePage }) => {
      await page.clock.setFixedTime(DURING_CAMPAIGN);
      await homePage.goto(offer);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.upt-announce')).toHaveCount(0);
    });

    test(`offer page shows the discount code and a booking link (${lang})`, async ({ page, homePage }) => {
      await homePage.goto(offer);

      await expect(page.getByText(DISCOUNT_CODE).first()).toBeVisible();
      await expect(page.locator(`main a[href$="${booking}"], .elementor a[href$="${booking}"]`).first()).toBeVisible();
    });

    test(`homepage banner links to the offer page (${lang})`, async ({ page, homePage }) => {
      await homePage.goto(home);

      // The header bar also links to the offer; this checks the in-page banner.
      const bannerLink = page.locator(`[data-elementor-type="wp-page"] a[href$="${offer}"]`);
      await expect(bannerLink.first()).toBeVisible();
    });
  }
});
