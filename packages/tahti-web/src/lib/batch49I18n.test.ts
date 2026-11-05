import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 49 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves ConfirmDialog keys in English and Finnish', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('studioSchedule.cancelConfirm').length).toBeGreaterThan(0);
      expect(t('studioUpdates.sendConfirm').length).toBeGreaterThan(0);
      expect(t('studioBranding.removeImageConfirm').length).toBeGreaterThan(0);
      expect(t('studioEditorProject.deleteDescription').length).toBeGreaterThan(
        0,
      );
      expect(t('studioGoLiveCredentials.rotateConfirm').length).toBeGreaterThan(
        0,
      );
      expect(t('studioDistributionSubmit.title').length).toBeGreaterThan(0);
      expect(t('releaseSmartLinks.removeDescription').length).toBeGreaterThan(
        0,
      );
      expect(
        t('studioCollectionEdit.removeBackdropDescription').length,
      ).toBeGreaterThan(0);
      expect(t('masteringPanel.removeDescription').length).toBeGreaterThan(0);
      expect(t('adminNews.deleteDescription').length).toBeGreaterThan(0);
      expect(
        t('adminStorage.deleteBulkTitle', { count: 2 }).length,
      ).toBeGreaterThan(0);
      expect(t('adminAddons.disableConfirm').length).toBeGreaterThan(0);
      expect(t('governanceConfirm.publishReportTitle', { year: 2026 })).toMatch(
        /2026/,
      );
      expect(t('actions.remove').length).toBeGreaterThan(0);
    }
    await i18n.changeLanguage('en_US');
  });
});
