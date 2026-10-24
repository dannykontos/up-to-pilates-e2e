import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';
import { getJsonLdBlocks } from '../../utils/seo';

/** Both FAQ pages carry the same 20 questions, in Romanian and in English. */
const EXPECTED_QUESTIONS = 20;

const faqPages = [
  { name: 'FAQ (RO)', path: routes.ro.faq },
  { name: 'FAQ (EN)', path: routes.en.faq },
];

type Question = { name?: string; acceptedAnswer?: { text?: string } };

/** Returns the FAQPage nodes found anywhere in the JSON-LD, including inside @graph. */
function faqPageNodes(blocks: Record<string, unknown>[]): { mainEntity?: Question[] }[] {
  const nodes: { mainEntity?: Question[] }[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if ([obj['@type']].flat().includes('FAQPage')) nodes.push(obj as { mainEntity?: Question[] });
      if (obj['@graph']) visit(obj['@graph']);
    }
  };
  visit(blocks);
  return nodes;
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * Guards the V4 FAQ rebuild (October 2026): the accordion keeps all questions,
 * prints exactly one FAQPage block (a second one from Rank Math would be a
 * duplicate Google ignores), the schema mirrors what visitors see, and each
 * question shows a single open/closed indicator.
 */
test.describe('FAQ pages', () => {
  for (const { name, path } of faqPages) {
    test(`all ${EXPECTED_QUESTIONS} questions are in the accordion: ${name}`, async ({ faqPage }) => {
      await faqPage.open(path);

      await expect(faqPage.items).toHaveCount(EXPECTED_QUESTIONS);
    });

    test(`exactly one FAQPage block, matching the visible questions: ${name}`, async ({ faqPage, request }) => {
      const html = await (await request.get(path)).text();
      const faqNodes = faqPageNodes(getJsonLdBlocks(html));
      expect(faqNodes, 'FAQPage structured data blocks on the page').toHaveLength(1);

      const schemaQuestions = (faqNodes[0].mainEntity ?? []).map((question) => normalize(question.name ?? ''));
      await faqPage.open(path);
      const visibleQuestions = await faqPage.questionTexts();

      expect(schemaQuestions).toHaveLength(visibleQuestions.length);
      expect(schemaQuestions).toEqual(visibleQuestions);
      for (const question of faqNodes[0].mainEntity ?? []) {
        expect(normalize(question.acceptedAnswer?.text ?? ''), `answer for "${question.name}"`).not.toBe('');
      }
    });

    test(`each question shows one open/closed indicator: ${name}`, async ({ faqPage }) => {
      await faqPage.open(path);

      const indicators = await faqPage.indicatorsPerQuestion();
      expect(indicators).toHaveLength(EXPECTED_QUESTIONS);
      expect(
        indicators.filter((count) => count !== 1),
        'questions with no icon or with two icons',
      ).toEqual([]);
    });
  }
});
