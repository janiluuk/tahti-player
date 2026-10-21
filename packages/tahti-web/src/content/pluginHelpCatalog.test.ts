import { describe, expect, it } from 'vitest';

import { getHelpArticle } from './help';
import { PLUGIN_HELP_TABLE, READY_PLUGIN_HELP } from './pluginHelpCatalog';

describe('READY_PLUGIN_HELP', () => {
  it('lists only usable add-ons with reviewable help copy', () => {
    expect(READY_PLUGIN_HELP.length).toBeGreaterThan(10);
    for (const plugin of READY_PLUGIN_HELP) {
      expect(plugin.name.length).toBeGreaterThan(1);
      expect(plugin.category.length).toBeGreaterThan(1);
      expect(['ready', 'partial']).toContain(plugin.state);
      expect(plugin.description.length).toBeGreaterThan(10);
      expect(plugin.help.length).toBeGreaterThan(20);
    }
  });

  it('feeds the Help Center add-ons table', () => {
    const article = getHelpArticle('add-ons');
    expect(article?.title).toBe('Add-ons');
    expect(
      article?.sections.some((section) => section.table === PLUGIN_HELP_TABLE),
    ).toBe(true);
    expect(PLUGIN_HELP_TABLE.rows).toHaveLength(READY_PLUGIN_HELP.length);
  });
});
