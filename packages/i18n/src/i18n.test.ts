import { afterEach, describe, expect, it } from 'vitest';

import i18n from './i18n';
import { localeLoaders } from './lazyLocales';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';
import fi_FI from './locales/fi_FI.json';

describe('lazy locale loading', () => {
  afterEach(async () => {
    await i18n.changeLanguage(DEFAULT_LOCALE);
  });

  it('bundles only the default locale up front', () => {
    expect(i18n.hasResourceBundle(DEFAULT_LOCALE, 'common')).toBe(true);
    expect(i18n.hasResourceBundle('ru_RU', 'common')).toBe(false);
  });

  it('has a loader for every non-default supported locale', () => {
    const lazy = SUPPORTED_LOCALES.map((locale) => locale.code).filter(
      (code) => code !== DEFAULT_LOCALE,
    );
    expect(Object.keys(localeLoaders).sort()).toEqual([...lazy].sort());
  });

  it('loads every namespace of a locale before changeLanguage resolves', async () => {
    await i18n.changeLanguage('fi_FI');
    expect(i18n.t('web:nav.listen')).toBe('Kuuntele');
    expect(i18n.t('discovery:recommendationError')).toBe(
      fi_FI.discovery.recommendationError,
    );
  });

  it('falls back to English for namespaces a locale lacks', async () => {
    await i18n.changeLanguage('de_DE');
    expect(i18n.t('common:actions.save')).toBe('Speichern');
    expect(i18n.t('web:nav.listen')).toBe('Listen');
  });

  it('keeps English for unknown language codes', async () => {
    await i18n.changeLanguage('xx_XX');
    expect(i18n.t('web:nav.listen')).toBe('Listen');
  });
});
