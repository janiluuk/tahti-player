// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import {
  applyLocale,
  currentLocale,
  dateLocaleTag,
  isWebLocale,
  WEB_LOCALES,
} from './locale';

describe('web locale', () => {
  afterEach(async () => {
    await applyLocale('en_US');
  });

  it('offers English and Suomi only', () => {
    expect(WEB_LOCALES.map((locale) => locale.nativeLabel)).toEqual([
      'English',
      'Suomi',
    ]);
    expect(isWebLocale('fi_FI')).toBe(true);
    expect(isWebLocale('de_DE')).toBe(false);
  });

  it('applies the locale to i18n and the document', async () => {
    await applyLocale('fi_FI');
    expect(currentLocale()).toBe('fi_FI');
    expect(i18n.t('web:nav.listen')).toBe('Kuuntele');
    expect(document.documentElement.lang).toBe('fi-FI');
  });

  it('gives the BCP 47 tag dates are formatted in', async () => {
    expect(dateLocaleTag()).toBe('en-US');
    await applyLocale('fi_FI');
    expect(dateLocaleTag()).toBe('fi-FI');
  });
});
