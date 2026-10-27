import type { Locator, Page } from '@playwright/test';

/**
 * The shared V4 footer (Elementor site part, classes prefixed `ft-`).
 * RO and EN pages get separate footers, each linking its own legal pages.
 */
export class Footer {
  constructor(private readonly page: Page) {}

  get root(): Locator {
    return this.page.locator('[data-elementor-type="footer"]');
  }

  get burnLogo(): Locator {
    return this.root.locator('img.ft-burn-logo');
  }

  /** Paths of the Privacy / Terms / Cookies links, in the order shown. */
  async legalHrefs(): Promise<string[]> {
    const hrefs = await this.root.locator('a.ft-link').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
    return hrefs.filter((href) => /confidentialitate|termeni|cookie|privacy|terms/.test(href));
  }
}
