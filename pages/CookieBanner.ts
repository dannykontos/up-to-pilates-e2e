import type { Locator, Page, Request } from '@playwright/test';

/**
 * The Complianz consent banner. Google Analytics (G-FL8VSJWDGP) is in the
 * "statistics" category, so it may only load after the visitor accepts.
 */
export class CookieBanner {
  constructor(private readonly page: Page) {}

  get root(): Locator {
    return this.page.locator('#cmplz-cookiebanner-container .cmplz-cookiebanner');
  }

  get acceptButton(): Locator {
    return this.root.getByRole('button', { name: /^(Acceptă|Accept)$/i });
  }

  get denyButton(): Locator {
    return this.root.getByRole('button', { name: /^(Refuză|Deny)$/i });
  }

  /** Starts collecting every request that goes to Google Analytics or Tag Manager. */
  recordAnalyticsRequests(): string[] {
    const urls: string[] = [];
    this.page.on('request', (req: Request) => {
      if (/google-analytics\.com|googletagmanager\.com/.test(req.url())) urls.push(req.url());
    });
    return urls;
  }

  /** Names of the Google Analytics cookies (_ga, _ga_<id>) currently set. */
  async analyticsCookies(): Promise<string[]> {
    const cookies = await this.page.context().cookies();
    return cookies.map((c) => c.name).filter((name) => /^_ga/.test(name));
  }
}
