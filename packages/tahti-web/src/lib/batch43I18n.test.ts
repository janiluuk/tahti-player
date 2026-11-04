import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 43 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves upload picker and channel-designer toast keys in English and Finnish', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('library.uploadTrackDialogTitle').length).toBeGreaterThan(0);
      expect(t('library.openFullUploadPage').length).toBeGreaterThan(0);
      expect(t('toasts.channelLookSaved').length).toBeGreaterThan(0);
      expect(t('toasts.presetNameRequired').length).toBeGreaterThan(0);
      expect(t('dm.blockConfirmTitle', { name: 'Nova' })).toMatch(/Nova/);
      expect(t('studioFans.title').length).toBeGreaterThan(0);
      expect(t('channelComments.emptyTitle').length).toBeGreaterThan(0);
      expect(
        t('toasts.radioPlaylistApplied', { name: 'Night', count: 3 }),
      ).toMatch(/Night/);
      expect(t('toasts.channelLookImagesAdded', { count: 2 })).toMatch(/2/);
    }
    await i18n.changeLanguage('en_US');
  });
});
