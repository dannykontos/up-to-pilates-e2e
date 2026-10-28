import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { routes } from '../test-data/urls';
import { ameliaCalendarDay, ameliaTimeSlot } from './amelia';

type BookingLanguage = 'ro' | 'en';

/** Amelia labels per site language; only the strings the flow relies on. */
const labels = {
  ro: {
    serviceCombobox: 'Selectați ședința',
    skipPackages: /Omiteți pachetele/i,
    continue: 'Continuă',
  },
  en: {
    serviceCombobox: 'Select Service',
    skipPackages: /Skip packages/i,
    continue: 'Continue',
  },
} as const;

/**
 * The Reformer booking flow (Amelia booking plugin, "full step" layout).
 *
 * Works on both the RO (/rezervare/) and EN (/en/book/) booking pages.
 *
 * Safety boundary: this page object deliberately stops at the "Datele
 * dumneavoastră" / "Your Information" (your details) step, once the booking summary and the
 * upcoming "Plată" (payment) step are visible in the stepper. It never
 * fills in customer details or advances into the payment step, so the
 * suite can never create a real appointment or trigger a real charge
 * against the production Amelia/Stripe integration.
 */
export class BookingPage extends BasePage {
  private readonly text: (typeof labels)[BookingLanguage];

  constructor(
    page: Page,
    private readonly language: BookingLanguage = 'ro',
  ) {
    super(page);
    this.text = labels[language];
  }

  async open(): Promise<void> {
    await this.goto(routes[this.language].booking);
  }

  get widget() {
    return this.page.locator('[id^="amelia-v2-booking"]');
  }

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get serviceCombobox() {
    return this.page.getByRole('combobox', { name: this.text.serviceCombobox });
  }

  get serviceOptions() {
    return this.page.getByRole('option');
  }

  private get skipPackagesButton() {
    return this.widget.getByRole('button', { name: this.text.skipPackages });
  }

  private get continueButton() {
    return this.widget.getByRole('button', { name: this.text.continue });
  }

  private get availableCalendarDays() {
    return this.widget.locator(ameliaCalendarDay);
  }

  private get timeSlots() {
    return this.widget.locator(ameliaTimeSlot);
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

  /**
   * Clicks the first bookable day until its time slots show up. On slow runs
   * (seen on WebKit in CI) a click that lands while availability is still
   * loading is ignored, so a single click is not enough.
   */
  async selectFirstAvailableDate(): Promise<void> {
    await expect(async () => {
      await this.availableCalendarDays.first().click({ timeout: 5000 });
      await expect(this.timeSlots.first()).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 45000 });
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
