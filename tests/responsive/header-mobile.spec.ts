import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';

const mobileMenu = {
  ro: [routes.ro.home, routes.ro.reformer, routes.ro.pricing, routes.ro.journal, routes.ro.faq, routes.ro.contact, routes.ro.booking],
  en: [routes.en.home, routes.en.reformer, routes.en.packages, routes.en.journal, routes.en.faq, routes.en.contact, routes.en.booking],
} as const;

/**
 * On phones the menu lives in a V4 accordion (`<details>` with the burger as
 * its `<summary>`). The panel must open on tap, list every page plus the
 * booking button in the page's language, and its links must navigate.
 */
test.describe('Mobile header / burger menu', () => {
  for (const lang of ['ro', 'en'] as const) {
    test(`opens and every link goes where it says: ${lang.toUpperCase()}`, async ({ page, homePage, navigation }) => {
      await homePage.goto(routes[lang].home);

      await expect(navigation.mobileLinks.first()).toBeHidden();
      await navigation.openMobileMenuIfCollapsed();

      // The panel opens with a short transition, so wait for every link.
      for (const link of await navigation.mobileLinks.all()) {
        await expect(link).toBeVisible();
      }
      expect(await navigation.mobileLinks.evaluateAll((links) => links.map((a) => a.getAttribute('href')))).toEqual(
        mobileMenu[lang],
      );

      await navigation.goTo('contact');
      await expect(page).toHaveURL(new RegExp(`${routes[lang].contact}$`));
    });
  }
});
