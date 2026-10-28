import { test, expect } from '../../fixtures/pages.fixture';

/**
 * Critical booking journey.
 *
 * Safety: this suite never reaches the "Plată" (payment) step. It stops as
 * soon as the booking summary (service + date/time) is confirmed and the
 * payment step is visible in the stepper - see BookingPage for details.
 * No real appointment, charge, or Stripe interaction ever happens here.
 */
test.describe('Booking flow', () => {
  test('a visitor can select a service, date and time and reach the booking summary', async ({ bookingPage }) => {
    await bookingPage.open();
    await expect(bookingPage.widget).toBeVisible();

    await bookingPage.selectFirstAvailableService();
    const selectedService = await bookingPage.stepperSelections.first().innerText();
    expect(selectedService).toMatch(/Pilates Reformer/i);

    await bookingPage.skipPackageUpsellIfShown();
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTimeSlot();
    await bookingPage.proceedToCustomerDetails();

    // Reached the "your details" step: the booking summary must reflect
    // the selected service and a concrete date/time.
    await expect(bookingPage.currentStepTitle).toHaveText('Datele dumneavoastră');

    await expect(bookingPage.stepperSteps).toHaveText([
      'Selectarea sedinței',
      'Data și ora',
      'Datele dumneavoastră',
      'Plată',
    ]);

    await expect(bookingPage.stepperSelections.nth(0)).toContainText(/Pilates Reformer/i);
    // e.g. "septembrie 21, 2026 - 08:00"
    await expect(bookingPage.stepperSelections.nth(1)).toContainText(/\d{4}.*\d{2}:\d{2}/);
  });

  test('an English-speaking visitor can book through /en/book/ up to the booking summary', async ({
    bookingPageEn,
  }) => {
    await bookingPageEn.open();
    await expect(bookingPageEn.widget).toBeVisible();

    await bookingPageEn.completeUpToBookingSummary();

    await expect(bookingPageEn.currentStepTitle).toHaveText('Your Information');

    await expect(bookingPageEn.stepperSteps).toHaveText([
      'Service Selection',
      'Date & Time',
      'Your Information',
      'Payments',
    ]);

    await expect(bookingPageEn.stepperSelections.nth(0)).toContainText(/Pilates Reformer/i);
    // e.g. "October 21, 2026 - 08:00"
    await expect(bookingPageEn.stepperSelections.nth(1)).toContainText(/[A-Z][a-z]+ \d{1,2}, \d{4} - \d{2}:\d{2}/);
  });

  test('English service names contain no Romanian words', async ({ bookingPageEn }) => {
    // Guards the Amelia EN translations: without them /en/book/ falls back to
    // the RO names (e.g. "Pilates Reformer | 1 Ședință").
    await bookingPageEn.open();
    await bookingPageEn.serviceCombobox.click();
    const names = await bookingPageEn.serviceOptions.allInnerTexts();

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name, `service "${name}"`).not.toMatch(/Ședinț|Sedint/i);
    }
  });
});
