import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FAQ pages (RO /intrebari-frecvente/, EN /en/faq/), rebuilt as an Elementor V4
 * accordion. Each question is a native <details>/<summary>, and the accordion
 * itself prints the FAQPage structured data, so the visible questions and the
 * schema come from the same source and must stay in step.
 */
export class FaqPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(path: string): Promise<void> {
    await this.goto(path);
  }

  /** One <details> per question. */
  get items(): Locator {
    return this.page.locator('main details');
  }

  get questions(): Locator {
    return this.items.locator('summary');
  }

  /** Question text as shown to visitors, whitespace collapsed. */
  async questionTexts(): Promise<string[]> {
    return this.questions.evaluateAll((summaries) =>
      summaries.map((summary) => (summary.textContent ?? '').replace(/\s+/g, ' ').trim()),
    );
  }

  /**
   * Open/closed indicators drawn in each question header: visible SVG icons
   * plus CSS ::after glyphs (the "+" sign). One header showing both a chevron
   * and a "+" is the regression this guards against.
   */
  async indicatorsPerQuestion(): Promise<number[]> {
    return this.questions.evaluateAll((summaries) =>
      summaries.map((summary) => {
        const svgs = Array.from(summary.querySelectorAll('svg')).filter((svg) => {
          const style = getComputedStyle(svg);
          return style.display !== 'none' && style.visibility !== 'hidden' && svg.getBoundingClientRect().width > 0;
        }).length;
        const glyphs = [summary, ...Array.from(summary.querySelectorAll('*'))].filter((el) => {
          const content = getComputedStyle(el, '::after').content;
          return content !== 'none' && content !== 'normal' && content !== '""';
        }).length;
        return svgs + glyphs;
      }),
    );
  }
}
