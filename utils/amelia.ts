import type { Page } from '@playwright/test';

/**
 * Records every non-GET call to Amelia's API (`wpamelia_api`). Reading
 * services, packages and free slots is all GET; anything else (customer,
 * booking, payment intent, coupon) writes to production, so the safe flows
 * assert this list stays empty.
 */
export function recordAmeliaWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.url().includes('wpamelia_api')) {
      writes.push(`${request.method()} ${new URL(request.url()).searchParams.get('call')}`);
    }
  });
  return writes;
}
