import { test, expect } from '../../fixtures/pages.fixture';
import { criticalPages, journalArticles, routes } from '../../test-data/urls';
import { boxesOf, elementsPastViewport, horizontalOverflow } from '../../utils/layout';

/** WCAG 2.2 "Target Size (Minimum)": tappable controls should be at least 24 x 24 CSS px. */
const MIN_TAP_TARGET = 24;
/** Body copy smaller than this is hard to read on a phone without zooming. */
const MIN_READABLE_FONT_PX = 15;

/**
 * Layout guards for phones (Mobile Chrome / Mobile Safari projects). These
 * catch the bugs a desktop run never sees: a block wider than the screen
 * that lets the page scroll sideways (it once showed as orange strips on
 * the edges), cards that stop stacking, and a header that loses its menu,
 * booking button or language switcher.
 */
test.describe('Mobile layout / no sideways scroll', () => {
  for (const { name, path } of criticalPages) {
    test(`page fits the screen width: ${name}`, async ({ page, homePage }) => {
      await homePage.goto(path);
      await page.waitForLoadState('load');

      const overflow = await horizontalOverflow(page);
      expect(
        overflow,
        `wider than the screen by ${overflow}px: ${(await elementsPastViewport(page)).join(', ')}`,
      ).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('Mobile layout / header', () => {
  for (const path of [routes.ro.home, routes.en.home]) {
    test(`menu, booking button and language switch are reachable: ${path}`, async ({ homePage, navigation, languageSwitcher }) => {
      await homePage.goto(path);

      const { menuToggle } = navigation;
      await expect(menuToggle).toBeVisible();
      await expect(navigation.bookCta).toBeVisible();

      const [toggleBox, ctaBox] = await Promise.all([menuToggle.boundingBox(), navigation.bookCta.boundingBox()]);
      for (const box of [toggleBox, ctaBox]) {
        expect(box!.width).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
        expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
      }

      await navigation.openMobileMenuIfCollapsed();
      // The panel opens with a short transition, so poll instead of checking once.
      await expect.poll(() => navigation.isLinkVisible('journal'), { message: 'Journal should be in the mobile menu' }).toBe(true);
      await expect(languageSwitcher.toggle).toBeVisible();
    });
  }
});

test.describe('Mobile layout / Journal', () => {
  for (const path of [routes.en.journal, routes.ro.journal]) {
    test(`article cards stack in a single column: ${path}`, async ({ page, journalPage }) => {
      await journalPage.open(path);
      await expect(journalPage.cardLinks.first()).toBeVisible();

      const viewport = page.viewportSize()!;
      const cards = await boxesOf(journalPage.cardLinks);
      expect(cards.length).toBeGreaterThan(1);
      // Every card spans most of the screen, i.e. no two cards share a row.
      expect(cards.filter((c) => c.width < viewport.width * 0.7)).toEqual([]);
    });
  }

  for (const { name, path } of journalArticles) {
    test(`article title and lead fit and stay readable: ${name}`, async ({ page, journalPage }) => {
      await journalPage.open(path);
      await expect(journalPage.articleTitle).toBeVisible();

      const viewport = page.viewportSize()!;
      const [title] = await boxesOf(journalPage.articleTitle);
      expect(title.x).toBeGreaterThanOrEqual(0);
      expect(title.x + title.width).toBeLessThanOrEqual(viewport.width);

      const leadFontSize = await journalPage.articleLead.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(leadFontSize).toBeGreaterThanOrEqual(MIN_READABLE_FONT_PX);
    });
  }
});
