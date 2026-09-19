import { test, expect } from '../../fixtures/pages.fixture';

/**
 * Runs only on the "Mobile Chrome" / "Mobile Safari" projects (see
 * playwright.config.ts). Focused on the two things most likely to break on
 * small viewports: navigation and the booking flow.
 */
test.describe('Responsive smoke', () => {
  test('homepage renders with a working mobile menu', async ({ page, homePage, navigation }) => {
    await homePage.open();
    await expect(homePage.heading).toBeVisible();

    await navigation.openMobileMenuIfCollapsed();
    await expect(page.locator('nav[aria-label="Mobile navigation"]')).toBeVisible();

    await navigation.goTo('contact');
    await expect(page).toHaveURL(/contact-cluj/);
  });

  test('booking flow reaches the summary step on a mobile viewport', async ({ bookingPage }) => {
    await bookingPage.open();
    await expect(bookingPage.widget).toBeVisible();

    await bookingPage.completeUpToBookingSummary();

    await expect(bookingPage.currentStepTitle).toHaveText('Datele dumneavoastră');
  });
});
