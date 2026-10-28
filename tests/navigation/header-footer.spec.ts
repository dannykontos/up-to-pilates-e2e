import { test, expect } from '../../fixtures/pages.fixture';
import { legalPages, pagesWithHeader, routes } from '../../test-data/urls';

/** Desktop menu, in order. RO "Prețuri" and EN "Packages" are the same page. */
const desktopMenu = {
  ro: [routes.ro.home, routes.ro.reformer, routes.ro.pricing, routes.ro.journal, routes.ro.faq, routes.ro.contact],
  en: [routes.en.home, routes.en.reformer, routes.en.packages, routes.en.journal, routes.en.faq, routes.en.contact],
} as const;

/**
 * The V4 header and footer are Elementor site parts, one pair per language,
 * shown on every page through display conditions. A wrong condition or a
 * half-published edit shows up as the RO header on an EN page, a language
 * switch that drops you on the homepage, or a footer linking the other
 * language's legal pages, so every page gets the same sweep. The markup
 * does not depend on the engine, so this spec runs on Chromium only.
 */
test.describe('Header and footer / every page', () => {
  for (const { name, path } of pagesWithHeader) {
    test(`header and footer match the page language: ${name}`, async ({ page, navigation, languageSwitcher, footer }) => {
      const response = await page.goto(path);
      expect(response!.status()).toBe(200);

      const lang = (await languageSwitcher.currentLanguageCode())!.startsWith('en') ? 'en' : 'ro';
      const other = lang === 'ro' ? 'en' : 'ro';

      await expect(navigation.header).toHaveCount(1);
      await expect(navigation.bookCta).toHaveAttribute('href', routes[lang].booking);
      expect(await page.locator('a.hd-link').evaluateAll((links) => links.map((a) => a.getAttribute('href')))).toEqual(
        desktopMenu[lang],
      );

      // The switcher follows Polylang's translation of this exact page; pages
      // without one (the EN-only guides) fall back to the other homepage.
      const translation = await page
        .locator(`link[rel="alternate"][hreflang="${other}"]`)
        .getAttribute('href', { timeout: 1000 })
        .catch(() => null);
      const expectedSwitch = translation ? new URL(translation).pathname : routes[other].home;
      expect(new URL((await languageSwitcher.targetHref())!).pathname).toBe(expectedSwitch);

      for (const logo of [navigation.burnLogo, footer.burnLogo]) {
        await expect(logo).toHaveAttribute('alt', /\S/);
      }
      expect(await footer.legalHrefs()).toEqual([...legalPages[lang]]);
    });
  }
});

test.describe('Header and footer / sticky header', () => {
  for (const path of [routes.ro.home, routes.en.home]) {
    test(`header stays pinned to the top while scrolling: ${path}`, async ({ page, navigation, footer }) => {
      // Sticky must live on the .elementor-location-header wrapper (Site Settings
      // custom CSS); on header.hd-header alone it has no room to stick.
      await page.goto(path);

      await footer.root.scrollIntoViewIfNeeded();
      await expect(footer.root).toBeInViewport();
      await expect.poll(async () => Math.round((await navigation.header.boundingBox())!.y), { timeout: 3000 }).toBe(0);
      await expect(navigation.bookCta).toBeInViewport();
    });
  }
});
