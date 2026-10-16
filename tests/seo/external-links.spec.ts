import { test, expect } from '@playwright/test';
import { criticalPages } from '../../test-data/urls';
import { fetchHtml, getExternalLinks } from '../../utils/seo';

/**
 * Hosts that answer every request the same way whether the target exists or
 * not (Instagram returns 200 for any profile name, Facebook returns a login
 * wall), so a request can't tell a broken link from a working one. Their
 * links are skipped rather than reported as false passes or false failures.
 */
const UNVERIFIABLE_HOSTS = ['instagram.com', 'facebook.com'];

/** Some sites refuse requests that don't look like a browser. */
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

const isVerifiable = (url: string) => {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return !UNVERIFIABLE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
};

/**
 * Outbound links (Burn, Google Maps, the gyms and running clubs in the
 * Journal guides) live on other sites and can break without anything
 * changing here. Collects them from every critical page and checks each
 * one still answers below 400 after redirects.
 */
test.describe('External links', () => {
  test('every outbound link on the site still resolves', async ({ request, baseURL }) => {
    test.setTimeout(180_000);
    const ownHost = new URL(baseURL!).hostname;

    const linksToPages = new Map<string, string[]>();
    for (const { path } of criticalPages) {
      const { body } = await fetchHtml(request, path);
      for (const link of getExternalLinks(body, ownHost).filter(isVerifiable)) {
        linksToPages.set(link, [...(linksToPages.get(link) ?? []), path]);
      }
    }
    expect(linksToPages.size, 'expected to find outbound links to check').toBeGreaterThan(0);

    const results = await Promise.all(
      [...linksToPages.keys()].map(async (link) => {
        const response = await request
          .get(link, { headers: { 'User-Agent': BROWSER_USER_AGENT }, timeout: 30_000 })
          .catch((error: Error) => ({ status: () => `request failed: ${error.message.split('\n')[0]}` }));
        return { link, status: response.status() };
      }),
    );

    const broken = results
      .filter(({ status }) => typeof status !== 'number' || status >= 400)
      .map(({ link, status }) => `${status} ${link} (on ${linksToPages.get(link)!.join(', ')})`);
    expect(broken, 'outbound links that no longer resolve').toEqual([]);
  });
});
