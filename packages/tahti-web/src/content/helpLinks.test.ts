import { describe, expect, it } from 'vitest';

import { router } from '../router';
import { HELP_ARTICLES } from './help';
import { HELP_ARTICLES_FI } from './help.fi';
import { HELP_GROUPS, QUICK_STARTS } from './helpUi';

/** `/channel/$slug`, `(/radio)`: a path at the start of a word, not inside a
 * URL, a file path or `a/b` shorthand. */
const IN_APP_PATH = /(?<![\w.:/<-])\/[a-z][a-z0-9$/-]*/g;

function routePatterns(): RegExp[] {
  return Object.keys(router.routesByPath)
    .filter((path) => path !== '/$')
    .map((path) => {
      const source = path
        .replace(/\/$/, '')
        .split('/')
        .map((part) =>
          part === '$'
            ? '.*'
            : part.startsWith('$')
              ? '[^/]+'
              : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        )
        .join('/');
      return new RegExp(`^${source || '/'}/?$`);
    });
}

const KNOWN_ROUTES = routePatterns();

function bodyText(sections: Array<{ heading: string; body: string[] }>) {
  return sections.flatMap((section) => [section.heading, ...section.body]);
}

function linksIn(lines: string[]): string[] {
  return lines.flatMap((line) =>
    [...line.matchAll(IN_APP_PATH)].map((match) =>
      match[0].replace(/[/-]+$/, ''),
    ),
  );
}

describe('help content', () => {
  it('has a unique slug per article', () => {
    const slugs = HELP_ARTICLES.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists every article in exactly one hub group', () => {
    const grouped = HELP_GROUPS.flatMap((group) => group.slugs);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(
      HELP_ARTICLES.map((article) => article.slug).sort(),
    );
  });

  it('points quick starts at real articles', () => {
    const slugs = new Set(HELP_ARTICLES.map((article) => article.slug));
    for (const item of QUICK_STARTS) {
      expect(slugs.has(item.slug), item.slug).toBe(true);
    }
  });

  it('only names in-app addresses that a route serves', () => {
    const texts = [
      ...HELP_ARTICLES.flatMap((article) => bodyText(article.sections)),
      ...Object.values(HELP_ARTICLES_FI).flatMap((article) =>
        bodyText(article.sections),
      ),
    ];
    const links = [...new Set(linksIn(texts))];
    expect(links.length).toBeGreaterThan(10);
    const dead = links.filter(
      (link) => !KNOWN_ROUTES.some((pattern) => pattern.test(link)),
    );
    expect(dead).toEqual([]);
    expect(KNOWN_ROUTES.some((pattern) => pattern.test('/no-such-page'))).toBe(
      false,
    );
  });

  it('only links production paths that the app serves', () => {
    for (const article of HELP_ARTICLES) {
      if (!article.productionPath) {
        continue;
      }
      expect(
        KNOWN_ROUTES.some((pattern) => pattern.test(article.productionPath!)),
        article.productionPath,
      ).toBe(true);
    }
  });
});
