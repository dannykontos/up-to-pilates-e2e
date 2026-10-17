import type { Locator, Page } from '@playwright/test';

/** How much wider than the viewport the page is, in CSS pixels (0 = no horizontal scroll). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/**
 * Visible elements that stick out past the right edge of the viewport,
 * described as `tag.class` so a failure points straight at the culprit.
 */
export async function elementsPastViewport(page: Page, limit = 5): Promise<string[]> {
  return page.evaluate((max) => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || box.right <= width + 1) continue;
      const classes = Array.from(el.classList).slice(0, 2).join('.');
      offenders.push(
        `${el.tagName.toLowerCase()}${classes ? '.' + classes : ''} (right edge ${Math.round(box.right)}px)`,
      );
      if (offenders.length >= max) break;
    }
    return offenders;
  }, limit);
}

/** Bounding boxes of every match, in document order. */
export async function boxesOf(locator: Locator): Promise<{ x: number; width: number; height: number }[]> {
  return locator.evaluateAll((els) =>
    els.map((el) => {
      const { x, width, height } = el.getBoundingClientRect();
      return { x, width, height };
    }),
  );
}
