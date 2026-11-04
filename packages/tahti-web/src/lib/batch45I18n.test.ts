import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 45 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves playlist, editor, admin and oauth toast keys in English and Finnish', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('toasts.couldNotRefreshTracklist').length).toBeGreaterThan(0);
      expect(t('toasts.playlistSettingsSaved').length).toBeGreaterThan(0);
      expect(t('toasts.coverUploaded').length).toBeGreaterThan(0);
      expect(t('toasts.queuedAsNewVersion').length).toBeGreaterThan(0);
      expect(t('toasts.firstTrackNotPlayable').length).toBeGreaterThan(0);
      expect(t('toasts.couldNotLoadTopLists').length).toBeGreaterThan(0);
      expect(t('toasts.cutMarked').length).toBeGreaterThan(0);
      expect(t('toasts.fadeAdded', { type: 'in' })).toMatch(/in/);
      expect(t('toasts.commentUpdated').length).toBeGreaterThan(0);
      expect(t('toasts.addedToNamed', { name: 'Nova' })).toMatch(/Nova/);
      expect(t('toasts.boughtNamed', { name: 'Fan' })).toMatch(/Fan/);
      expect(t('toasts.soundcloudExpired').length).toBeGreaterThan(0);
      expect(t('toasts.spotifyLinked').length).toBeGreaterThan(0);
      expect(t('toasts.topicOpened').length).toBeGreaterThan(0);
      expect(t('toasts.profileSetUp').length).toBeGreaterThan(0);
      expect(t('toasts.allTracksAlreadyQueued').length).toBeGreaterThan(0);
    }
    await i18n.changeLanguage('en_US');
  });
});
