import type { Locator, Page } from '@playwright/test';
import { routes } from '../test-data/urls';

export type NavPageKey = 'home' | 'reformer' | 'packages' | 'faq' | 'contact' | 'journal';

/** Where each menu entry points, in both languages ("Servicii" / "Packages" share a key). */
const navTargets: Record<NavPageKey, readonly string[]> = {
  home: [routes.ro.home, routes.en.home],
  reformer: [routes.ro.reformer, routes.en.reformer],
  packages: [routes.ro.pricing, routes.en.packages],
  faq: [routes.ro.faq, routes.en.faq],
  contact: [routes.ro.contact, routes.en.contact],
  journal: [routes.ro.journal, routes.en.journal],
};

/**
 * The header's main navigation (Elementor V4 header, classes prefixed `hd-`).
 * Menu links carry no stable id, so we key off their href, which stays the
 * same when the (locale-dependent) link text changes.
 */
export class Navigation {
  constructor(private readonly page: Page) {}

  /**
   * Desktop links (`hd-link`) on wide viewports, the burger panel links
   * (`hd-mlink`) on narrow ones - only one set is ever visible, so we filter
   * down to that one.
   */
  private linkFor(key: NavPageKey): Locator {
    const hrefs = navTargets[key].map((href) => `[href="${href}"]`).join(', ');
    return this.page.locator(`:is(a.hd-link, a.hd-mlink):is(${hrefs}):visible`).first();
  }

  /** The burger: a `<summary>` inside the header's accordion, labelled "Menu". */
  get menuToggle(): Locator {
    return this.page.locator('summary.hd-menu-h');
  }

  async openMobileMenuIfCollapsed(): Promise<void> {
    // isVisible() never waits, which matters here: on desktop viewports the
    // burger is `display: none` and would never satisfy an auto-waiting
    // check, hanging until the action timeout.
    if (!(await this.menuToggle.isVisible())) return;

    const isOpen = await this.menuToggle.evaluate((summary) => (summary.parentElement as HTMLDetailsElement).open);
    if (!isOpen) {
      await this.menuToggle.click();
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
    return this.page.locator('a.hd-cta');
  }
}
