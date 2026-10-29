import { test, expect } from '@playwright/test';
import { routes } from '../../test-data/urls';
import { fetchHtml } from '../../utils/seo';

/** Visible text of the page body (Elementor page only, without header and footer). */
function pageText(html: string): string {
  const start = html.indexOf('data-elementor-type="wp-page"');
  const end = html.indexOf('data-elementor-type="footer"');
  const body = html.slice(start, end > start ? end : undefined);
  return body
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Guards the legal pages updated in October 2026: the date shown, the package
 * catalog in the privacy policy (Pilates + PT was added with the V4 rebuild)
 * and the tools listed in the cookie policy. When a tool is added to or removed
 * from the site, the cookie policy must change with it.
 */
const legal = {
  ro: { privacy: routes.ro.privacy, cookies: routes.ro.cookies, updated: 'Ultima actualizare: octombrie 2026' },
  en: { privacy: routes.en.privacy, cookies: routes.en.cookies, updated: 'Last updated: October 2026' },
};

const cookieTools = ['Complianz', 'Wordfence', 'Polylang', 'Google Analytics', '_ga'];

test.describe('Legal pages', () => {
  for (const [lang, page] of Object.entries(legal)) {
    const label = lang.toUpperCase();

    test(`privacy policy is dated October 2026 and lists the Pilates + PT packages: ${label}`, async ({ request }) => {
      const { status, body } = await fetchHtml(request, page.privacy);
      expect(status).toBe(200);
      const text = pageText(body);

      expect(text).toContain(page.updated);
      expect(text).toContain('Pilates + PT');
    });

    test(`cookie policy is dated October 2026 and lists every tool that sets cookies: ${label}`, async ({ request }) => {
      const { status, body } = await fetchHtml(request, page.cookies);
      expect(status).toBe(200);
      const text = pageText(body);

      expect(text).toContain(page.updated);
      for (const tool of cookieTools) {
        expect(text, `cookie policy should mention ${tool}`).toContain(tool);
      }
    });
  }
});
