import type { Page } from '@playwright/test';

/**
 * The RO/EN switcher in the header. It always targets the translated
 * equivalent of the current page (via Polylang), so its accessible name
 * flips between "Switch to English" and "Switch to Romanian".
 */
export class LanguageSwitcher {
  constructor(private readonly page: Page) {}

  private get toggle() {
    return this.page.locator('.upt-language-switcher a.upt-language-link');
  }

  async switchLanguage(): Promise<void> {
    await this.toggle.click();
  }

  async targetHref(): Promise<string | null> {
    return this.toggle.getAttribute('href');
  }

  async targetLabel(): Promise<string | null> {
    return this.toggle.getAttribute('aria-label');
  }

  async currentLanguageCode(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }
}
