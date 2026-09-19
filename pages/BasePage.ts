import type { Page } from '@playwright/test';

/**
 * Common behaviour shared by every page object: navigation and the
 * cookie-consent banner that appears on first visit in every locale.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.dismissCookieBanner();
  }

  /**
   * The CMP banner ("Acceptă" / "Refuză" / "Vezi preferințele") blocks
   * interaction with the header and the booking widget until dismissed.
   * It only appears on a fresh (cookie-less) browser context.
   */
  async dismissCookieBanner(): Promise<void> {
    const acceptButton = this.page.getByRole('button', { name: /^(Acceptă|Accept)$/i });
    try {
      await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
      await acceptButton.click();
    } catch {
      // Banner did not appear (e.g. consent already stored) - nothing to do.
    }
  }

  async title(): Promise<string> {
    return this.page.title();
  }
}
