import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';

/**
 * Students Month campaign (1-31 October 2026, code STUDENTS25OFF).
 *
 * The announcement bar is part of the V4 header (`.hd-announce`). Unlike the
 * old header it has no date logic and is also shown on the offer page, so
 * the two tests for that behaviour are marked fixme until the bar is
 * removed by hand on 1 November. Delete this spec when the campaign is
 * cleaned up (homepage banners and the bar removed, offer pages switched to
 * "back next year").
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

      const bar = page.locator('.hd-announce');
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('link')).toHaveAttribute('href', offer);
    });

    test(`announcement bar disappears from 1 November (${lang})`, async ({ page, homePage }) => {
      test.fixme(true, 'The V4 header bar has no date logic; it has to be removed by hand on 1 November.');
      await page.clock.setFixedTime(AFTER_CAMPAIGN);
      await homePage.goto(home);

      await expect(page.locator('.hd-announce')).toHaveCount(0);
    });

    test(`announcement bar is hidden on the offer page itself (${lang})`, async ({ page, homePage }) => {
      test.fixme(true, 'The V4 header shows the bar on every page, the offer page included.');
      await page.clock.setFixedTime(DURING_CAMPAIGN);
      await homePage.goto(offer);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.hd-announce')).toHaveCount(0);
    });

    test(`offer page shows the discount code and a booking link (${lang})`, async ({ page, homePage }) => {
      await homePage.goto(offer);

      // Scoped to the page body: the header also shows the code (announcement
      // bar) and a booking link (CTA and burger panel).
      const content = page.locator('[data-elementor-type="wp-page"]');
      await expect(content.getByText(DISCOUNT_CODE).first()).toBeVisible();
      await expect(content.locator(`a[href$="${booking}"]`).first()).toBeVisible();
    });

    test(`homepage banner links to the offer page (${lang})`, async ({ page, homePage }) => {
      await homePage.goto(home);

      // The header bar also links to the offer; this checks the in-page banner.
      const bannerLink = page.locator(`[data-elementor-type="wp-page"] a[href$="${offer}"]`);
      await expect(bannerLink.first()).toBeVisible();
    });
  }
});
