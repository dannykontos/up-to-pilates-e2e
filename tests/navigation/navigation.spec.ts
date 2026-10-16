import { test, expect } from '../../fixtures/pages.fixture';
import { translatedPagePairs, routes } from '../../test-data/urls';

test.describe('Navigation', () => {
  // "Every critical page answers 200 without a redirect" lives in
  // tests/seo/seo-technical.spec.ts and runs once, on the http project.

  for (const { name, ro, en } of translatedPagePairs) {
    test(`language switcher links ${name} RO -> EN and back`, async ({ page, languageSwitcher }) => {
      await page.goto(ro);

      const enHref = await languageSwitcher.targetHref();
      expect(new URL(enHref!).pathname).toBe(en);

      await languageSwitcher.switchLanguage();
      await expect(page).toHaveURL(new RegExp(`${en}$`));

      const roHref = await languageSwitcher.targetHref();
      expect(new URL(roHref!).pathname).toBe(ro);
    });
  }

  test('booking CTA in the header always points to the booking page', async ({ navigation, homePage }) => {
    await homePage.open();
    await expect(navigation.bookCta).toHaveAttribute('href', routes.ro.booking);
  });
});
