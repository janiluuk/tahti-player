import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 47 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves studio show/go-live and desktop library toast keys', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('toasts.couldNotLoadShow').length).toBeGreaterThan(0);
      expect(t('toasts.youreLive').length).toBeGreaterThan(0);
      expect(t('toasts.draftSaved').length).toBeGreaterThan(0);
      expect(t('toasts.coverSaved').length).toBeGreaterThan(0);
      expect(t('toasts.scanCancelled').length).toBeGreaterThan(0);
      expect(t('toasts.desktopUpdateAvailable', { version: '1.0' })).toMatch(
        /1\.0/,
      );
    }
    await i18n.changeLanguage('en_US');
  });
});
