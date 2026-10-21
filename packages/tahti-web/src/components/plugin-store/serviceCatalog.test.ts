import { describe, expect, it } from 'vitest';

import { servicePluginsForCategory } from './serviceCatalog';

describe('servicePluginsForCategory', () => {
  it('never deep-links an import add-on back to the add-on store', () => {
    for (const plugin of servicePluginsForCategory('import')) {
      if (plugin.action.kind === 'deep-link') {
        expect(plugin.action.to).not.toMatch(/^\/sources/);
      }
    }
  });

  it('sends Mixcloud search to Studio collections, where its panel lives', () => {
    const mixcloud = servicePluginsForCategory('import').find(
      (plugin) => plugin.id === 'mixcloud-embed',
    );
    expect(mixcloud?.action).toEqual({
      kind: 'deep-link',
      to: '/studio/collections',
    });
  });
});
