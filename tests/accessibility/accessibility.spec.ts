import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures/pages.fixture';
import { routes } from '../../test-data/urls';

/** WCAG 2.1 level A and AA rules, the usual legal and practical target. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Known site-wide issues, excluded so the suite fails only on new problems.
 * Each one is a follow-up, not an accepted state:
 * - color-contrast: brand orange #E07A5F (2.6:1) and teal #81B29A (2.1:1)
 *   on the eggshell #F4F1DE background, plus the small grey uppercase labels
 *   (2.3-4.2:1), sit below WCAG AA (4.5:1 for text, 3:1 for large headings).
 *   Fixing it means darker shades of the palette, which is a design decision.
 * - label-content-name-mismatch: aria-labels that don't contain the visible
 *   text, which breaks voice control ("click up to Pilates"): the header
 *   logo and language switcher, the service and package cards on the home
 *   and pricing pages, and the "Buy package" buttons.
 */
const KNOWN_ISSUES = ['color-contrast', 'label-content-name-mismatch'];

const pagesToAudit = [
  { name: 'Home (RO)', path: routes.ro.home },
  { name: 'Home (EN)', path: routes.en.home },
  { name: 'Reformer (RO)', path: routes.ro.reformer },
  { name: 'Pricing (RO)', path: routes.ro.pricing },
  { name: 'FAQ (RO)', path: routes.ro.faq },
  { name: 'Contact (RO)', path: routes.ro.contact },
  { name: 'Booking (RO)', path: routes.ro.booking },
  { name: 'Journal (RO)', path: routes.ro.journal },
  { name: 'Journal (EN)', path: routes.en.journal },
  { name: 'Article: exam season (EN)', path: routes.en.articleExamSeason },
  { name: 'Students Month (RO)', path: routes.ro.studentsMonth },
];

test.describe('Accessibility (WCAG 2.1 AA, axe-core)', () => {
  for (const { name, path } of pagesToAudit) {
    test(`no new WCAG violations: ${name}`, async ({ page, homePage }) => {
      await homePage.goto(path);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).disableRules(KNOWN_ISSUES).analyze();

      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}, ${v.nodes.length}x): ${v.help} - e.g. ${v.nodes[0].target.join(' ')}`,
      );
      expect(summary, 'new accessibility violations').toEqual([]);
    });
  }
});
