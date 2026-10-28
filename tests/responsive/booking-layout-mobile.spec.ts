import { test, expect } from '../../fixtures/pages.fixture';
import { bookingFlowPages } from '../../test-data/urls';
import { elementsPastViewport, horizontalOverflow } from '../../utils/layout';

/**
 * On phones the booking card moves above the intro card, so the calendar is
 * the first thing a visitor sees, and nothing may push the page sideways.
 */
test.describe('Mobile booking pages / V4 layout', () => {
  for (const { name, path } of bookingFlowPages) {
    test(`calendar comes first and the page fits the screen: ${name}`, async ({ page, bookingLayout }) => {
      await page.goto(path);
      await expect(bookingLayout.widget).toBeVisible();

      const [booking, intro] = await Promise.all([
        bookingLayout.bookingCard.boundingBox(),
        bookingLayout.introCard.boundingBox(),
      ]);
      expect(booking!.y, 'the Amelia card should sit above the intro card').toBeLessThan(intro!.y);

      const overflow = await horizontalOverflow(page);
      expect(
        overflow,
        `wider than the screen by ${overflow}px: ${(await elementsPastViewport(page)).join(', ')}`,
      ).toBeLessThanOrEqual(1);
    });
  }
});
