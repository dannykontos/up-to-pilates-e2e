import { test, expect } from '../../fixtures/pages.fixture';
import { bookingFlowPages } from '../../test-data/urls';
import { boxesOf } from '../../utils/layout';

/**
 * The four V4 booking pages share one shell: intro card on the left, the
 * Amelia widget in a card on the right, an info section below. These checks
 * catch a half-published edit (widget dropped out of its card, a second H1,
 * build placeholders left in) that the flow tests would not notice.
 */
test.describe('Booking pages / V4 layout', () => {
  for (const { name, path, infoHeading } of bookingFlowPages) {
    test(`layout is intact: ${name}`, async ({ page, bookingLayout }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(bookingLayout.widget).toBeVisible();
      await expect(bookingLayout.infoHeading).toContainText(infoHeading);
      await expect(bookingLayout.buildLeftovers).toHaveCount(0);

      // Side by side on desktop, same top and same height.
      const [[intro], [booking]] = await Promise.all([
        boxesOf(bookingLayout.introCard),
        boxesOf(bookingLayout.bookingCard),
      ]);
      expect(booking.x).toBeGreaterThan(intro.x + intro.width - 1);
      expect(Math.abs(booking.height - intro.height)).toBeLessThanOrEqual(2);
    });
  }
});
