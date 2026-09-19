import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { routes } from '../test-data/urls';

/**
 * Package purchase flow (also powered by Amelia). Like BookingPage, this
 * object stops as soon as we have proven a package can be selected and the
 * flow advances - it never reaches the payment step, so no real purchase
 * or reservation is ever created against production.
 */
export class PackagesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(routes.ro.packagesBooking);
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

  private get continueButton() {
    return this.widget.getByRole('button', { name: 'Continuă' });
  }

  async waitForPackagesToLoad(): Promise<void> {
    await this.packageItems.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Selects the first package and advances past the selection step. */
  async selectFirstPackage(): Promise<void> {
    await this.waitForPackagesToLoad();
    await this.packageItems.first().click();
    await this.continueButton.click();
  }
}
