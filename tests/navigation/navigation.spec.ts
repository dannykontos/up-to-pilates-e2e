import { test, expect } from '../../fixtures/pages.fixture';
import { criticalPages, translatedPagePairs, routes } from '../../test-data/urls';

test.describe('Navigation', () => {
  for (const { name, path } of criticalPages) {
    test(`internal link resolves without redirect: ${name}`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${name} (${path}) should respond 200 with no redirect`).toBe(200);
    });
  }

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
