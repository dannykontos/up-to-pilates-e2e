import type { Locator, Page } from '@playwright/test';

export type NavPageKey = 'home' | 'reformer' | 'packages' | 'faq' | 'contact' | 'journal';

/**
 * The header's main navigation. Links carry a stable `data-page` attribute
 * that survives copy/translation changes, so we key off that instead of
 * the (locale-dependent) link text.
 */
export class Navigation {
  constructor(private readonly page: Page) {}

  /**
   * Desktop nav on wide viewports, mobile nav (behind the burger) on narrow
   * ones - only one of the two is ever visible, so we filter down to that one.
   */
  private linkFor(key: NavPageKey): Locator {
    return this.page
      .locator('nav[aria-label="Main navigation"], nav[aria-label="Mobile navigation"]')
      .locator(`a[data-page="${key}"]:visible`);
  }

  async openMobileMenuIfCollapsed(): Promise<void> {
    const toggle = this.page.getByRole('button', { name: 'Open menu' });
    // isVisible() never waits, which matters here: on desktop viewports this
    // button is `display: none` and would never satisfy an auto-waiting
    // check like getAttribute(), hanging until the action timeout.
    if (!(await toggle.isVisible())) return;

    const isCollapsed = (await toggle.getAttribute('aria-expanded')) === 'false';
    if (isCollapsed) {
      await toggle.click();
    }
  }

  async goTo(key: NavPageKey): Promise<void> {
    await this.openMobileMenuIfCollapsed();
    await this.linkFor(key).click();
  }

  async isLinkVisible(key: NavPageKey): Promise<boolean> {
    return this.linkFor(key).isVisible();
  }

  async hrefFor(key: NavPageKey): Promise<string | null> {
    return this.linkFor(key).getAttribute('href');
  }

  /** The persistent "Rezervă" / "Book" call-to-action shown in the header on every viewport. */
  get bookCta(): Locator {
    return this.page.locator('a.upt-header-cta');
  }
}
