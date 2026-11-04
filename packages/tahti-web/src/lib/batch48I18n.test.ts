import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

describe('batch 48 i18n leftovers', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('resolves schedule, branding and updates toast keys', async () => {
    for (const lng of ['en_US', 'fi_FI'] as const) {
      await i18n.changeLanguage(lng);
      const t = i18n.getFixedT(lng, 'web');
      expect(t('toasts.nextBroadcastSaved').length).toBeGreaterThan(0);
      expect(t('toasts.pressKitBioSaved').length).toBeGreaterThan(0);
      expect(t('toasts.logoSaved').length).toBeGreaterThan(0);
      expect(t('toasts.audioUploadedProcessing').length).toBeGreaterThan(0);
      expect(t('toasts.addedNamedToMultitrack', { name: 'Take' })).toMatch(
        /Take/,
      );
    }
    await i18n.changeLanguage('en_US');
  });
});
