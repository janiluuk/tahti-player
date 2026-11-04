import { describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { formatPlayCount } from './topListEntries';

describe('formatPlayCount', () => {
  it('pluralises in English', () => {
    expect(formatPlayCount(1)).toBe('1 play');
    expect(formatPlayCount(2)).toBe('2 plays');
  });

  it('pluralises in Finnish', async () => {
    await i18n.changeLanguage('fi_FI');
    try {
      expect(formatPlayCount(1)).toBe('1 kuuntelu');
      expect(formatPlayCount(3)).toBe('3 kuuntelua');
    } finally {
      await i18n.changeLanguage('en_US');
    }
  });
});
