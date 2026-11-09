import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('UX slices C1-C12 strings', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('pluralizes header stats and collection labels in Finnish', () => {
    const t = i18n.getFixedT('fi_FI', 'web');
    expect(t('entityStats.playlists', { count: 1 })).toBe('Soittolista');
    expect(t('entityStats.playlists', { count: 3 })).toBe('Soittolistaa');
    expect(t('studioReleases.tracksCount', { count: 1 })).toBe('1 kappale');
    expect(t('library.collectionItems', { count: 2 })).toBe('2 kohdetta');
    expect(t('library.collectionTabs.albums')).toBe('Albumit');
  });

  it('pluralizes the same labels in English', () => {
    const t = i18n.getFixedT('en_US', 'web');
    expect(t('entityStats.playlists', { count: 1 })).toBe('Playlist');
    expect(t('studioReleases.tracksCount', { count: 1 })).toBe('1 track');
    expect(t('library.collectionItems', { count: 1 })).toBe('1 item');
  });
});
