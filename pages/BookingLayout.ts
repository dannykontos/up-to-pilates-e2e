import type { Page } from '@playwright/test';

/**
 * The V4 shell shared by the four booking pages: an intro card on the left
 * (`bk-left`), the Amelia widget in a card on the right (`bk-right`) and an
 * info section below ("Ce să știi" / "Cum funcționează pachetele").
 */
export class BookingLayout {
  constructor(private readonly page: Page) {}

  get introCard() {
    return this.page.locator('.bk-left');
  }

  get bookingCard() {
    return this.page.locator('.bk-right');
  }

  get widget() {
    return this.bookingCard.locator('[id^="amelia-v2-booking"]');
  }

  get infoHeading() {
    return this.page.locator('h2.ct-h2');
  }

  /** Placeholder boxes from the V4 build ("Aici tragi ..."), which must not ship. */
  get buildLeftovers() {
    return this.page.locator('.bk-slot').or(this.page.getByText('Aici tragi'));
  }
}
