import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { routes } from '../test-data/urls';
import { ameliaCalendarDay, ameliaTimeSlot } from './amelia';

type PackagesLanguage = 'ro' | 'en';

/** Amelia labels per site language; only the strings the flow relies on. */
const labels = {
  ro: {
    continue: 'Continuă',
    addAppointment: 'Adăugați mai multe programări',
    bookLaterNotice: /Numărul de programări necesare pentru rezervare: 0/,
    allBookedLater: 'Toate programările vor fi selectate ulterior',
    detailsStep: 'Datele dumneavoastră',
    fieldError: /Vă rugăm să introduceți/,
  },
  en: {
    continue: 'Continue',
    addAppointment: 'Add more Appointments',
    bookLaterNotice: /Number of appointments required for booking: 0/,
    allBookedLater: 'All appointments will be selected later',
    detailsStep: 'Your Information',
    fieldError: /Please enter/,
  },
} as const;

/**
 * Package purchase flow (also powered by Amelia), on /rezervari-pachete/ and
 * /en/packages-booking/.
 *
 * Safety boundary: like BookingPage, this object never goes past the
 * "Datele dumneavoastră" / "Your Information" step. It never fills in
 * customer details and never opens the payment step, which is where Amelia
 * starts a Stripe payment intent, so no customer, booking or charge is ever
 * created against production.
 */
export class PackagesPage extends BasePage {
  private readonly text: (typeof labels)[PackagesLanguage];

  constructor(
    page: Page,
    private readonly language: PackagesLanguage = 'ro',
  ) {
    super(page);
    this.text = labels[language];
  }

  async open(): Promise<void> {
    await this.goto(routes[this.language].packagesBooking);
  }

  get heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get widget() {
    return this.page.locator('[id^="amelia-v2-booking"]');
  }

  get packageItems() {
    return this.page.locator('.am-fs__ps-item');
  }

  get packageNames() {
    return this.page.locator('.am-fs__ps-name');
  }

  get packagePrices() {
    return this.page.locator('.am-fs__ps-price');
  }

  get currentStepTitle() {
    return this.widget.locator('.am-fs__main-heading-inner-title');
  }

  /** "0 appointments required": the package can be bought now and booked later. */
  get bookLaterNotice() {
    return this.widget.getByText(this.text.bookLaterNotice);
  }

  /** Shown on the overview when no session was booked together with the package. */
  get allBookedLaterNote() {
    return this.widget.getByText(this.text.allBookedLater);
  }

  get customerFields() {
    return this.widget.locator(
      'input[name="firstName"], input[name="lastName"], input[name="email"], input[name="phone"]',
    );
  }

  get fieldErrors() {
    return this.widget.getByText(this.text.fieldError);
  }

  private get continueButton() {
    return this.widget.getByRole('button', { name: this.text.continue });
  }

  async waitForPackagesToLoad(): Promise<void> {
    await this.packageItems.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Selects the first package and advances past the selection step. */
  async selectFirstPackage(): Promise<void> {
    await this.waitForPackagesToLoad();
    await this.packageItems.first().click();
    await this.continue();
  }

  /** Selects a package by its exact Amelia name and advances past the selection step. */
  async selectPackage(name: string): Promise<void> {
    await this.waitForPackagesToLoad();
    await this.packageItems.filter({ has: this.page.getByText(name, { exact: true }) }).click();
    await this.continue();
  }

  /**
   * Clicks "Continuă" and waits for the next step to render. Every step reuses
   * the same button, so a second click sent before the step changes is lost
   * (seen on WebKit in CI, where Amelia renders more slowly).
   */
  async continue(): Promise<void> {
    const stepBefore = await this.currentStepTitle.innerText();
    await this.continueButton.click();
    await expect(this.currentStepTitle).not.toHaveText(stepBefore);
  }

  /** Clicks "Continuă" without expecting to advance, e.g. to trigger field validation. */
  async pressContinue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Books the first session together with the package: opens a calendar,
   * then clicks the first bookable day until its time slots show up (the
   * first click can land while availability is still loading).
   */
  async bookFirstAvailableSession(): Promise<void> {
    await this.widget.getByRole('button', { name: this.text.addAppointment }).click();
    const day = this.widget.locator(ameliaCalendarDay).first();
    const slot = this.widget.locator(ameliaTimeSlot).first();
    await expect(async () => {
      await day.click({ timeout: 5000 });
      await expect(slot).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 45000 });
    await slot.click();
  }

  async expectOnDetailsStep(): Promise<void> {
    await expect(this.currentStepTitle).toHaveText(this.text.detailsStep);
  }
}
