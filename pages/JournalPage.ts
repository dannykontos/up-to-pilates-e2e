import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The Journal "front page" (newspaper layout) and its articles. Cards come
 * from an automatic Elementor loop, so tests key off the stable `fp-*` /
 * `ja-*` global classes rather than any particular article.
 */
export class JournalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(path: string): Promise<void> {
    await this.goto(path);
  }

  /** One link per article card in the loop (the lead story included). */
  get cardLinks() {
    return this.page.locator('a:has(.fp-h2)');
  }

  /** Card titles get their punctuation wrapped in orange spans by a header script. */
  get cardTitlePunctuation() {
    return this.page.locator('.fp-h2 .upt-punct');
  }

  get articleTitle() {
    return this.page.locator('h1.ja-title');
  }

  /** Orange punctuation inside the article H1, authored as <span>/<em>. */
  get articleTitlePunctuation() {
    return this.articleTitle.locator('span, em');
  }

  get articleLead() {
    return this.page.locator('.ja-lead');
  }

  get bylineLink() {
    return this.page.getByRole('link', { name: /^(By|De) Danny K\.$/ });
  }

  /** Astra's own title and "By ... / date" bar - must stay hidden behind the Elementor template. */
  get themeTitleArtifacts() {
    return this.page.locator('.entry-title, .entry-meta');
  }
}
