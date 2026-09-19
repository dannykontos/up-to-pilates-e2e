import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';

/**
 * Package purchase flow.
 *
 * Safety: stops right after selecting a package, once the flow has
 * advanced past the selection step. It never enters customer details or
 * payment, so no real package purchase is ever created.
 */
test.describe('Packages', () => {
  test('Packages page loads with correct package information', async ({ packagesPage }) => {
    await packagesPage.open();
    await expect(packagesPage.heading).toBeVisible();
    await packagesPage.waitForPackagesToLoad();

    const names = await packagesPage.packageNames.allInnerTexts();
    const prices = await packagesPage.packagePrices.allInnerTexts();

    expect(names.length).toBeGreaterThan(0);
    expect(names).toHaveLength(prices.length);
    for (const price of prices) {
      expect(price).toMatch(/RON\s?\d+(\.\d{2})?/);
    }
    expect(names.join(' ')).toMatch(/Reformer/i);
  });

  test('selecting a package advances the booking flow', async ({ packagesPage }) => {
    await packagesPage.open();
    await packagesPage.selectFirstPackage();

    await expect(packagesPage.currentStepTitle).not.toHaveText('Selectarea pachetului');
  });

  test('package booking page is reachable from the pricing page CTA', async ({ page }) => {
    await page.goto(routes.ro.pricing);
    const packageCta = page.locator(`a[href="${routes.ro.packagesBooking}"]`).first();
    await expect(packageCta).toBeVisible();
    await packageCta.click();
    await expect(page).toHaveURL(new RegExp(`${routes.ro.packagesBooking}$`));
  });
});
