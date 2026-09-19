import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { routes } from '../test-data/urls';

/**
 * The Reformer booking flow (Amelia booking plugin, "full step" layout).
 *
 * Safety boundary: this page object deliberately stops at the "Datele
 * dumneavoastră" (your details) step, once the booking summary and the
 * upcoming "Plată" (payment) step are visible in the stepper. It never
 * fills in customer details or advances into the payment step, so the
 * suite can never create a real appointment or trigger a real charge
 * against the production Amelia/Stripe integration.
 */
export class BookingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(routes.ro.booking);
  }

  get widget() {
    return this.page.locator('[id^="amelia-v2-booking"]');
  }

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get serviceCombobox() {
    return this.page.getByRole('combobox', { name: 'Selectați ședința' });
  }

  get serviceOptions() {
    return this.page.getByRole('option');
  }

  private get skipPackagesButton() {
    return this.widget.getByRole('button', { name: /Omiteți pachetele/i });
  }

  private get continueButton() {
    return this.widget.getByRole('button', { name: 'Continuă' });
  }

  private get availableCalendarDays() {
    return this.page.locator('.am-advsc__dayGridMonth-cell:not(.am-advsc__dayGridMonth-disabled)');
  }

  private get timeSlots() {
    return this.page.locator('.am-advsc__slots-item');
  }

  /** Labels of the steps shown in the left-hand stepper, in order. */
  get stepperSteps() {
    return this.widget.locator('.am-fs-sb__step-heading');
  }

  /** Current selection summary shown for each completed step in the stepper. */
  get stepperSelections() {
    return this.widget.locator('.am-fs-sb__step-selection');
  }

  get currentStepTitle() {
    return this.widget.locator('.am-fs__main-heading-inner-title');
  }

  async selectFirstAvailableService(): Promise<void> {
    await this.serviceCombobox.click();
    await this.serviceOptions.first().click();
  }

  /**
   * A once-off package upsell screen appears right after picking a service.
   * We always continue with the single session that was already selected.
   */
  async skipPackageUpsellIfShown(): Promise<void> {
    await this.continueButton.click();
    if (await this.skipPackagesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.skipPackagesButton.click();
    }
  }

  async selectFirstAvailableDate(): Promise<void> {
    const day = this.availableCalendarDays.first();
    await day.waitFor({ state: 'visible', timeout: 15000 });
    await day.click();
  }

  async selectFirstAvailableTimeSlot(): Promise<void> {
    const slot = this.timeSlots.first();
    await slot.waitFor({ state: 'visible', timeout: 15000 });
    await slot.click();
  }

  async proceedToCustomerDetails(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Runs the full safe path: service -> date -> time -> customer-details
   * step, stopping right before any personal data or payment is entered.
   */
  async completeUpToBookingSummary(): Promise<void> {
    await this.selectFirstAvailableService();
    await this.skipPackageUpsellIfShown();
    await this.selectFirstAvailableDate();
    await this.selectFirstAvailableTimeSlot();
    await this.proceedToCustomerDetails();
  }
}
