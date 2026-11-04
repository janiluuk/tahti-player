import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 44 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves recordings, distribution, editor and go-live keys in English and Finnish', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('studioRecordings.title').length).toBeGreaterThan(0);
      expect(t('studioRecordings.emptyTitle').length).toBeGreaterThan(0);
      expect(t('studioDistribution.title').length).toBeGreaterThan(0);
      expect(t('studioDistribution.emptyTitle').length).toBeGreaterThan(0);
      expect(t('studioEditorList.title').length).toBeGreaterThan(0);
      expect(t('studioEditorList.emptyTitle').length).toBeGreaterThan(0);
      expect(t('studioGoLive.confirmTitle').length).toBeGreaterThan(0);
      expect(t('toasts.radio247SettingsSaved').length).toBeGreaterThan(0);
      expect(t('toasts.rotationSourceSaved').length).toBeGreaterThan(0);
      expect(t('toasts.channelCreated').length).toBeGreaterThan(0);
      expect(t('toasts.creditsSavedNamed', { title: 'Nova' })).toMatch(/Nova/);
      expect(t('studioPlaylistEditor.removeCoverTitle').length).toBeGreaterThan(
        0,
      );
      expect(t('multistream.removeTitle').length).toBeGreaterThan(0);
      expect(t('actions.cancel').length).toBeGreaterThan(0);
    }
    await i18n.changeLanguage('en_US');
  });
});
