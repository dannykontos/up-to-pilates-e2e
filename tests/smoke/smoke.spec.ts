import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';
import type { NavPageKey } from '../../pages/Navigation';

test.describe('Smoke', () => {
  test('homepage loads', async ({ page, homePage }) => {
    await homePage.open();
    await expect(homePage.heading).toBeVisible();
    await expect(page).toHaveTitle(/Up To|Pilates/i);
  });

  test('main navigation reaches every top-level page', async ({ page, homePage, navigation }) => {
    await homePage.open();

    const destinations: { key: NavPageKey; path: string }[] = [
      { key: 'reformer', path: routes.ro.reformer },
      { key: 'packages', path: routes.ro.pricing },
      { key: 'faq', path: routes.ro.faq },
      { key: 'contact', path: routes.ro.contact },
    ];

    for (const destination of destinations) {
      await navigation.goTo(destination.key);
      await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await homePage.open();
    }
  });

  test('RO/EN language switching works from the homepage', async ({ page, homePage, languageSwitcher }) => {
    await homePage.open();

    await languageSwitcher.switchLanguage();
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/i);

    await languageSwitcher.switchLanguage();
    await expect(page).toHaveURL(new RegExp(`${routes.ro.home}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', /^ro/i);
  });

  test('Reformer Pilates page loads', async ({ reformerPage }) => {
    await reformerPage.open();
    await expect(reformerPage.heading).toBeVisible();
  });

  test('Services/Pricing page loads', async ({ page }) => {
    await page.goto(routes.ro.pricing);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('FAQ page loads', async ({ page }) => {
    await page.goto(routes.ro.faq);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Contact page loads', async ({ contactPage }) => {
    await contactPage.open();
    await expect(contactPage.heading).toBeVisible();
    await expect(contactPage.form).toBeVisible();
  });

  test('Booking page loads', async ({ bookingPage }) => {
    await bookingPage.open();
    await expect(bookingPage.heading).toBeVisible();
    await expect(bookingPage.widget).toBeVisible();
  });
});
