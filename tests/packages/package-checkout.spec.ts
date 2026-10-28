import { test, expect } from '../../fixtures/pages.fixture';
import { recordAmeliaWrites } from '../../utils/amelia';
import { packageCatalog } from '../../test-data/urls';

/**
 * Buying a package, step by step, up to "Datele dumneavoastră" / "Your
 * Information". This is where the flow broke for real customers, so each
 * step is checked, not just that the widget advances.
 *
 * Safety: the flow stops before any customer data is typed and never opens
 * the payment step (that is where Amelia starts a Stripe payment intent).
 * Every test also fails if the page sends any non-GET call to Amelia, so a
 * change in Amelia that starts writing earlier is caught instead of silently
 * creating customers in production.
 */
const SIX_SESSIONS = packageCatalog.find((p) => p.price === 'RON460.00')!.name;

test.describe('Packages / checkout up to customer details', () => {
  for (const lang of ['ro', 'en'] as const) {
    test(`buy now, book later: ${lang.toUpperCase()}`, async ({ page, packagesPage, packagesPageEn }) => {
      const packages = { ro: packagesPage, en: packagesPageEn }[lang];
      const writes = recordAmeliaWrites(page);
      await packages.open();

      await packages.selectPackage(SIX_SESSIONS[lang]);
      await expect(packages.widget).toContainText('RON460.00');
      await expect(packages.widget).toContainText('x6');
      await packages.continue();

      // No session has to be booked now; the rest is booked from the customer panel.
      await expect(packages.bookLaterNotice).toBeVisible();
      await packages.continue();

      await expect(packages.allBookedLaterNote).toBeVisible();
      await expect(packages.widget).toContainText('RON460.00');
      await packages.continue();

      await packages.expectOnDetailsStep();
      await expect(packages.customerFields).toHaveCount(4);

      // Continuing with empty fields is stopped in the browser, on the same step.
      await packages.continue();
      await expect(packages.fieldErrors.first()).toBeVisible();
      await packages.expectOnDetailsStep();

      expect(writes, 'no customer, booking or payment call may be sent').toEqual([]);
    });
  }

  test('buy and book the first session in one go: RO', async ({ page, packagesPage }) => {
    const writes = recordAmeliaWrites(page);
    await packagesPage.open();

    await packagesPage.selectPackage(SIX_SESSIONS.ro);
    await packagesPage.continue();
    await packagesPage.bookFirstAvailableSession();
    await packagesPage.continue();

    // With a session picked, the overview no longer says everything is booked later.
    await expect(packagesPage.widget).toContainText('RON460.00');
    await expect(packagesPage.allBookedLaterNote).toHaveCount(0);
    await packagesPage.continue();

    await packagesPage.expectOnDetailsStep();
    expect(writes, 'no customer, booking or payment call may be sent').toEqual([]);
  });
});
