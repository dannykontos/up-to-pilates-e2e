import type { APIRequestContext } from '@playwright/test';

/**
 * Small helpers around the raw HTML `<head>` for lightweight SEO/technical
 * checks. These are intentionally simple regex lookups - they are not a
 * replacement for a real crawler, just a guard against regressions.
 */

export async function fetchHtml(request: APIRequestContext, url: string): Promise<{ status: number; body: string }> {
  const response = await request.get(url);
  return { status: response.status(), body: await response.text() };
}

export function getCanonicalHref(html: string): string | null {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!match) return null;
  const href = match[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

export function getHreflangLinks(html: string): { hreflang: string; href: string }[] {
  const links = html.match(/<link[^>]+rel=["']alternate["'][^>]*hreflang=["'][^>]*>/gi) || [];
  return links
    .map((tag) => {
      const hreflang = tag.match(/hreflang=["']([^"']+)["']/i)?.[1];
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
      return hreflang && href ? { hreflang, href } : null;
    })
    .filter((link): link is { hreflang: string; href: string } => link !== null);
}

export function getRobotsMeta(html: string): string | null {
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
  if (!match) return null;
  const content = match[0].match(/content=["']([^"']+)["']/i);
  return content ? content[1] : null;
}

export function getJsonLdBlocks(html: string): Record<string, unknown>[] {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const blocks: Record<string, unknown>[] = [];

  for (const script of scripts) {
    const jsonText = script.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
      }
    } catch {
      // Malformed JSON-LD is a real issue, but parsing it is out of scope here.
      // The test asserting on the returned blocks will simply not find what it expects.
    }
  }

  return blocks;
}

/** Collects every `@type` found in JSON-LD, including nested `@graph` entries. */
export function collectSchemaTypes(blocks: Record<string, unknown>[]): string[] {
  const types: string[] = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if (typeof obj['@type'] === 'string') types.push(obj['@type']);
      if (Array.isArray(obj['@type'])) types.push(...(obj['@type'] as string[]));
      if (obj['@graph']) visit(obj['@graph']);
    }
  };

  visit(blocks);
  return types;
}
