import { test, expect } from '@playwright/test';
import { routes } from '../../test-data/urls';
import { crawlersBlockedByRobots } from '../../utils/seo';

/** Crawlers behind ChatGPT, Perplexity, Claude and the search indexes they rely on. */
const AI_AND_SEARCH_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Bingbot'];

/**
 * Guards for how AI assistants find the site: crawlers must stay allowed,
 * and llms.txt (the plain-text site summary for language models) must stay
 * reachable with working links.
 */
test.describe('AI visibility', () => {
  test('robots.txt does not block AI or search crawlers from the site', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();

    expect(crawlersBlockedByRobots(robots, AI_AND_SEARCH_CRAWLERS)).toEqual([]);
  });

  for (const bot of AI_AND_SEARCH_CRAWLERS) {
    test(`${bot} gets the real page, not a block or challenge`, async ({ request }) => {
      const response = await request.get(routes.en.articleExamSeason, {
        headers: { 'User-Agent': `Mozilla/5.0 (compatible; ${bot}/1.0)` },
      });
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain('Exam season in Cluj');
    });
  }

  test('llms.txt is published as plain text and describes the studio', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/text\/plain/);

    const body = await response.text();
    expect(body).toMatch(/^# Up To Pilates/);
    expect(body).toContain('Burn Fitness Sigma');
  });

  test('every link in llms.txt resolves with 200', async ({ request }) => {
    const body = await (await request.get('/llms.txt')).text();
    const links = [...new Set([...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]))];
    expect(links.length).toBeGreaterThan(0);

    // One request at a time: firing them all at once gets throttled by the
    // site firewall and shows up as timeouts instead of real broken links.
    const broken: string[] = [];
    for (const link of links) {
      const status = (await request.get(link, { maxRedirects: 0 })).status();
      if (status !== 200) broken.push(`${status} ${link}`);
    }
    expect(broken, 'llms.txt links that redirect or fail').toEqual([]);
  });
});
