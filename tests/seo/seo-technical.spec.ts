import { test, expect } from '@playwright/test';
import { criticalPages, routes } from '../../test-data/urls';
import {
  fetchHtml,
  getCanonicalHref,
  getHreflangLinks,
  getRobotsMeta,
  getJsonLdBlocks,
  collectSchemaTypes,
} from '../../utils/seo';

/**
 * Lightweight technical/SEO regression checks - not a replacement for a
 * dedicated crawler (e.g. Ahrefs/Screaming Frog). These only guard against
 * critical regressions: broken canonicals, missing hreflang, missing
 * structured data, or pages quietly starting to redirect/404.
 */
test.describe('SEO / Technical smoke', () => {
  for (const { name, path } of criticalPages) {
    test(`HTTP 200 and no unexpected redirect: ${name}`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${name} should not redirect and should respond 200`).toBe(200);
    });
  }

  test('homepage has a self-referencing canonical tag', async ({ request, baseURL }) => {
    const { body } = await fetchHtml(request, routes.ro.home);
    const canonical = getCanonicalHref(body);
    expect(canonical).toBe(baseURL);
  });

  test('homepage declares RO/EN/x-default hreflang alternates', async ({ request }) => {
    const { body } = await fetchHtml(request, routes.ro.home);
    const hreflangs = getHreflangLinks(body).map((l) => l.hreflang);

    expect(hreflangs).toEqual(expect.arrayContaining(['ro', 'en', 'x-default']));
  });

  test('homepage robots meta allows indexing', async ({ request }) => {
    const { body } = await fetchHtml(request, routes.ro.home);
    const robots = getRobotsMeta(body);

    expect(robots).not.toBeNull();
    expect(robots).toMatch(/index/i);
    expect(robots).not.toMatch(/noindex/i);
  });

  test('robots.txt references a sitemap and the sitemap is reachable', async ({ request }) => {
    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);

    const robotsBody = await robotsResponse.text();
    const sitemapMatch = robotsBody.match(/Sitemap:\s*(\S+)/i);
    expect(sitemapMatch, 'robots.txt should declare a Sitemap: directive').not.toBeNull();

    const sitemapUrl = sitemapMatch![1];
    const sitemapResponse = await request.get(sitemapUrl);
    expect(sitemapResponse.status(), `sitemap at ${sitemapUrl} should be reachable`).toBe(200);
  });

  test('homepage exposes JSON-LD structured data with Organization info', async ({ request }) => {
    const { body } = await fetchHtml(request, routes.ro.home);
    const blocks = getJsonLdBlocks(body);
    expect(blocks.length).toBeGreaterThan(0);

    const types = collectSchemaTypes(blocks);
    const localBusinessLikeTypes = [
      'LocalBusiness',
      'Organization',
      'ExerciseGym',
      'HealthClub',
      'SportsActivityLocation',
    ];
    expect(
      types.some((type) => localBusinessLikeTypes.includes(type)),
      `expected one of ${localBusinessLikeTypes.join(', ')} in JSON-LD, got: ${types.join(', ')}`,
    ).toBe(true);
  });

  test('EN homepage canonical points to the EN URL, not the RO one', async ({ request, baseURL }) => {
    const { body } = await fetchHtml(request, routes.en.home);
    const canonical = getCanonicalHref(body);
    expect(canonical).toBe(new URL(routes.en.home, baseURL).toString());
  });
});
