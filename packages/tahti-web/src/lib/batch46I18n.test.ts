import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 46 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves distribution, hearthis, radio and jam toast keys', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('toasts.catalogSaved').length).toBeGreaterThan(0);
      expect(t('toasts.textLayerSaved').length).toBeGreaterThan(0);
      expect(t('toasts.jamCouldNotRemoveMember').length).toBeGreaterThan(0);
      expect(t('toasts.hearthisUsernameSaved').length).toBeGreaterThan(0);
      expect(t('toasts.radioBrowserSearchFailed').length).toBeGreaterThan(0);
      expect(t('toasts.lastFmConnected').length).toBeGreaterThan(0);
      expect(t('toasts.reportSent').length).toBeGreaterThan(0);
      expect(t('toasts.savedNamedQuotes', { name: 'Nova' })).toMatch(/Nova/);
      expect(t('toasts.queuedForPlatform', { platform: 'X' })).toMatch(/X/);
    }
    await i18n.changeLanguage('en_US');
  });
});
