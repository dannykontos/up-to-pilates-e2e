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
});
