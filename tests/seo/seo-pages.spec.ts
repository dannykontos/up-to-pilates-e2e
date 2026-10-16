import { test, expect } from '@playwright/test';
import { indexablePages, noindexPages, translatedPagePairs, routes } from '../../test-data/urls';
import {
  fetchHtml,
  getCanonicalHref,
  getHreflangLinks,
  getRobotsMeta,
  getTitle,
  getMetaDescription,
  countH1,
  getJsonLdBlocks,
  collectSchemaTypes,
} from '../../utils/seo';

/** Google truncates titles at roughly 60 characters and descriptions at roughly 160. */
const MAX_TITLE_LENGTH = 60;
const DESCRIPTION_LENGTH = { min: 50, max: 160 };

/**
 * Per-page on-page SEO guards for every indexable page, so a new page or a
 * Rank Math edit can't silently ship a missing description, a duplicate H1
 * (e.g. the theme title coming back) or a canonical pointing elsewhere.
 */
test.describe('SEO / Every indexable page', () => {
  for (const { name, path } of indexablePages) {
    test(`on-page basics: ${name}`, async ({ request, baseURL }) => {
      const { status, body } = await fetchHtml(request, path);
      expect(status).toBe(200);

      expect(getCanonicalHref(body), 'canonical should point to the page itself').toBe(
        new URL(path, baseURL).toString(),
      );

      const robots = getRobotsMeta(body);
      expect(robots).toMatch(/index/i);
      expect(robots).not.toMatch(/noindex/i);

      const title = getTitle(body);
      expect(title, 'page should have a <title>').toBeTruthy();
      expect(title!.length, `title too long for Google: "${title}"`).toBeLessThanOrEqual(MAX_TITLE_LENGTH);

      const description = getMetaDescription(body);
      expect(description, 'page should have a meta description').toBeTruthy();
      expect(description!.length).toBeGreaterThanOrEqual(DESCRIPTION_LENGTH.min);
      expect(description!.length).toBeLessThanOrEqual(DESCRIPTION_LENGTH.max);

      expect(countH1(body), 'exactly one H1 per page').toBe(1);
    });
  }

  test('titles and meta descriptions are unique across indexable pages', async ({ request }) => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();

    for (const { name, path } of indexablePages) {
      const { body } = await fetchHtml(request, path);
      const title = getTitle(body) ?? '';
      const description = getMetaDescription(body) ?? '';

      expect(titles.get(title), `"${name}" reuses the title of another page`).toBeUndefined();
      expect(descriptions.get(description), `"${name}" reuses the description of another page`).toBeUndefined();
      titles.set(title, name);
      descriptions.set(description, name);
    }
  });
});

test.describe('SEO / Noindex pages', () => {
  for (const { name, path } of noindexPages) {
    test(`stays out of search results: ${name}`, async ({ request }) => {
      const { status, body } = await fetchHtml(request, path);
      expect(status).toBe(200);
      expect(getRobotsMeta(body)).toMatch(/noindex/i);
    });
  }
});

test.describe('SEO / Hreflang', () => {
  for (const { name, ro, en } of translatedPagePairs) {
    test(`RO and EN versions point to each other: ${name}`, async ({ request, baseURL }) => {
      const roUrl = new URL(ro, baseURL).toString();
      const enUrl = new URL(en, baseURL).toString();

      for (const path of [ro, en]) {
        const { body } = await fetchHtml(request, path);
        const links = getHreflangLinks(body);
        expect(links.find((l) => l.hreflang === 'ro')?.href, `${path} -> ro alternate`).toBe(roUrl);
        expect(links.find((l) => l.hreflang === 'en')?.href, `${path} -> en alternate`).toBe(enUrl);
      }
    });
  }
});

test.describe('SEO / Structured data', () => {
  for (const path of [routes.ro.contact, routes.en.contact]) {
    test(`Contact page exposes FAQPage and ContactPage schema: ${path}`, async ({ request }) => {
      const { body } = await fetchHtml(request, path);
      const types = collectSchemaTypes(getJsonLdBlocks(body));
      expect(types).toEqual(expect.arrayContaining(['ContactPage']));
      expect(body, 'FAQ block should print FAQPage schema').toContain('FAQPage');
    });
  }

  test('sitemaps list every indexable page', async ({ request, baseURL }) => {
    const index = await (await request.get('/sitemap_index.xml')).text();
    const sitemapUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(sitemapUrls.length).toBeGreaterThan(0);

    const listed = new Set<string>();
    for (const url of sitemapUrls) {
      const xml = await (await request.get(url)).text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) listed.add(m[1]);
    }

    const missing = indexablePages
      .map(({ path }) => new URL(path, baseURL).toString())
      .filter((url) => !listed.has(url));
    expect(missing, 'indexable pages missing from the sitemap').toEqual([]);
  });
});
