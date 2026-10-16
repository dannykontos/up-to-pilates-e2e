import { test, expect } from '../../fixtures/pages.fixture';
import { journalArticles, routes } from '../../test-data/urls';

/** Brand peach (#E07A5F) used for title punctuation across the Journal. */
const BRAND_ORANGE = 'rgb(224, 122, 95)';

test.describe('Journal front page', () => {
  test('EN Journal lists the EN articles and not the RO one', async ({ journalPage }) => {
    await journalPage.open(routes.en.journal);

    const hrefs = await journalPage.cardLinks.evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining([
        routes.en.articleExamSeason,
        routes.en.articleRunningClubs,
        routes.en.articleFitnessExpats,
      ]),
    );
    expect(hrefs).not.toContain(routes.ro.articleExamSeason);
  });

  test('RO Jurnal lists the RO article', async ({ journalPage }) => {
    await journalPage.open(routes.ro.journal);

    const hrefs = await journalPage.cardLinks.evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
    expect(hrefs).toContain(routes.ro.articleExamSeason);
  });

  for (const path of [routes.en.journal, routes.ro.journal]) {
    test(`every card links to a live article: ${path}`, async ({ journalPage, request }) => {
      await journalPage.open(path);
      await expect(journalPage.cardLinks.first()).toBeVisible();

      const hrefs = await journalPage.cardLinks.evaluateAll((links) =>
        links.map((link) => (link as HTMLAnchorElement).href),
      );
      for (const href of new Set(hrefs)) {
        const response = await request.get(href, { maxRedirects: 0 });
        expect(response.status(), `${href} should respond 200`).toBe(200);
      }
    });

    test(`card titles get orange punctuation: ${path}`, async ({ journalPage }) => {
      await journalPage.open(path);

      await expect(journalPage.cardTitlePunctuation.first()).toBeVisible();
      await expect(journalPage.cardTitlePunctuation.first()).toHaveCSS('color', BRAND_ORANGE);
    });
  }
});

test.describe('Journal articles', () => {
  for (const { name, path } of journalArticles) {
    test(`renders on the Elementor template with one title: ${name}`, async ({ page, journalPage }) => {
      await journalPage.open(path);

      // An update from the classic WordPress editor once reset these posts to
      // the default Astra template, bringing back a second H1 and the orange
      // "By ... / date" bar above the article.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(journalPage.themeTitleArtifacts).toHaveCount(0);
      await expect(journalPage.articleTitle).toBeVisible();
    });

    test(`title punctuation is brand orange: ${name}`, async ({ journalPage }) => {
      await journalPage.open(path);

      await expect(journalPage.articleTitlePunctuation.first()).toHaveCSS('color', BRAND_ORANGE);
    });

    test(`lead summary and byline are present: ${name}`, async ({ journalPage, request }) => {
      await journalPage.open(path);

      await expect(journalPage.articleLead).toBeVisible();
      await expect(journalPage.bylineLink).toBeVisible();

      // The author archive is kept (noindex) because every byline links to it.
      const authorHref = await journalPage.bylineLink.getAttribute('href');
      const response = await request.get(authorHref!, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });
  }
});
