import type { Locator, Page } from '@playwright/test';

/**
 * The RO/EN switcher in the header ("🇬🇧 EN" / "🇷🇴 RO"). It always targets
 * the translated equivalent of the current page (via Polylang) and stays
 * visible next to the booking button on every viewport.
 */
export class LanguageSwitcher {
  constructor(private readonly page: Page) {}

  get toggle(): Locator {
    return this.page.locator('a.hd-lang');
  }

  async switchLanguage(): Promise<void> {
    await this.toggle.click();
  }

  async targetHref(): Promise<string | null> {
    return this.toggle.getAttribute('href');
  }

  /** The visible label, e.g. "🇬🇧 EN" on Romanian pages. */
  async targetLabel(): Promise<string | null> {
    return (await this.toggle.textContent())?.trim() ?? null;
  }

  async currentLanguageCode(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }
}
