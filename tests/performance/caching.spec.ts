import { test, expect } from '@playwright/test';
import { bookingPages, routes } from '../../test-data/urls';

/** Signature WP Fastest Cache appends to every page it serves from cache. */
const PAGE_CACHE_MARKER = '<!-- WP Fastest Cache';

/**
 * Page cache and compression (WP Fastest Cache, set up October 2026).
 * Booking pages must always be rendered live so Amelia never shows stale
 * slots; everything else should be served compressed.
 */
test.describe('Caching and compression', () => {
  for (const { name, path } of bookingPages) {
    test(`booking page is never served from the page cache: ${name}`, async ({ request }) => {
      const body = await (await request.get(path)).text();
      expect(body).not.toContain(PAGE_CACHE_MARKER);
    });
  }

  for (const path of [routes.ro.home, routes.en.home, routes.en.journal]) {
    test(`HTML is served gzip-compressed: ${path}`, async ({ request }) => {
      const response = await request.get(path, { headers: { 'Accept-Encoding': 'gzip' } });
      expect(response.headers()['content-encoding']).toBe('gzip');
    });
  }
});
