import { describe, expect, it } from 'vitest';

import {
  pluginAudienceForTarget,
  pluginCategoriesForRole,
} from './pluginStoreCategories';

describe('pluginCategoriesForRole', () => {
  it('shows listeners only the listener add-on list', () => {
    expect(pluginCategoriesForRole('LISTENER').map((item) => item.id)).toEqual([
      'listener',
    ]);
  });

  it('adds artist tools for artists', () => {
    expect(pluginCategoriesForRole('ARTIST').map((item) => item.id)).toEqual([
      'listener',
      'artist',
    ]);
  });

  it('keeps admin tools exclusive to board users', () => {
    expect(pluginCategoriesForRole('BOARD').map((item) => item.id)).toEqual([
      'listener',
      'artist',
      'admin',
    ]);
  });
});

describe('pluginAudienceForTarget', () => {
  it.each([
    ['listen', 'listener'],
    ['radio', 'listener'],
    ['scrobbling', 'listener'],
    ['import', 'artist'],
    ['export', 'artist'],
    ['fingerprinting', 'artist'],
    ['channel', 'artist'],
    ['tools', 'admin'],
  ] as const)('maps legacy %s links to %s', (target, audience) => {
    expect(pluginAudienceForTarget(target)).toBe(audience);
  });

  it('falls back to listener add-ons for unknown links', () => {
    expect(pluginAudienceForTarget('unknown')).toBe('listener');
  });
});
