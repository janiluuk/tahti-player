import { describe, expect, it } from 'vitest';

import { getLocalizedHelpArticle, HELP_ARTICLES } from './help';
import { HELP_ARTICLES_FI } from './help.fi';

describe('Finnish help', () => {
  it('translates every article with matching section counts', () => {
    for (const article of HELP_ARTICLES) {
      const fi = HELP_ARTICLES_FI[article.slug];
      expect(fi, article.slug).toBeDefined();
      expect(fi?.sections.length, article.slug).toBe(article.sections.length);
      fi?.sections.forEach((section, index) => {
        expect(section.body.length > 0, `${article.slug} #${index}`).toBe(
          (article.sections[index]?.body.length ?? 0) > 0,
        );
      });
    }
  });

  it('has no Finnish entry without an English article', () => {
    const slugs = new Set(HELP_ARTICLES.map((article) => article.slug));
    for (const slug of Object.keys(HELP_ARTICLES_FI)) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });

  it('keeps slugs and uses the Finnish add-ons table when localizing', () => {
    const fi = getLocalizedHelpArticle('add-ons', 'fi');
    const en = getLocalizedHelpArticle('add-ons', 'en');
    expect(fi?.title).toBe('Lisäosat');
    expect(fi?.slug).toBe('add-ons');
    expect(fi?.sections[1]?.table?.rows).toHaveLength(
      en?.sections[1]?.table?.rows.length ?? -1,
    );
    expect(fi?.sections[1]?.table?.columns[0]).toBe('Nimi');
  });
});
