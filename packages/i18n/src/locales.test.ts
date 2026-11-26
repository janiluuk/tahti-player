import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  isLocaleCode,
  matchBrowserLocales,
  SUPPORTED_LOCALES,
  toBcp47,
} from './locales';
import de_DE from './locales/de_DE.json';
import en_US from './locales/en_US.json';
import fi_FI from './locales/fi_FI.json';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, nested]) => collectKeys(nested, prefix ? `${prefix}.${key}` : key),
    );
  }
  return prefix ? [prefix] : [];
}

describe('locale registry', () => {
  it('lists Finnish next to English', () => {
    expect(SUPPORTED_LOCALES.map((locale) => locale.code)).toContain('fi_FI');
    expect(SUPPORTED_LOCALES[1]?.code).toBe('fi_FI');
  });

  it('accepts only registered locale codes', () => {
    expect(isLocaleCode('fi_FI')).toBe(true);
    expect(isLocaleCode('en_US')).toBe(true);
    expect(isLocaleCode('fi')).toBe(false);
    expect(isLocaleCode(null)).toBe(false);
  });

  it('maps Finnish browser tags to fi_FI', () => {
    expect(matchBrowserLocales(['fi-FI', 'en'])).toBe('fi_FI');
    expect(matchBrowserLocales(['fi'])).toBe('fi_FI');
    expect(matchBrowserLocales(['sv-FI', 'en-US'])).toBe('en_US');
    expect(matchBrowserLocales([])).toBe(DEFAULT_LOCALE);
  });

  it('converts registry codes to BCP 47', () => {
    expect(toBcp47('fi_FI')).toBe('fi-FI');
    expect(toBcp47('en_US')).toBe('en-US');
  });
});

describe('Finnish catalog', () => {
  it('covers every English key', () => {
    const englishKeys = collectKeys(en_US);
    const finnishKeys = new Set(collectKeys(fi_FI));
    expect(englishKeys.filter((key) => !finnishKeys.has(key))).toEqual([]);
  });

  it('has no web key that English lacks', () => {
    const englishWeb = new Set(collectKeys(en_US.web));
    expect(
      collectKeys(fi_FI.web).filter((key) => !englishWeb.has(key)),
    ).toEqual([]);
  });

  it('has a web key for every English web key', () => {
    const finnishWeb = new Set(collectKeys(fi_FI.web));
    expect(
      collectKeys(en_US.web).filter((key) => !finnishWeb.has(key)),
    ).toEqual([]);
  });

  it('does not leave Finnish strings identical to German Crowdin leftovers', () => {
    expect(fi_FI.common.app.name).toBe('Tahti Player');
    expect(fi_FI.web.nav.listen).toBe('Kuuntele');
    expect(fi_FI.web.language.label).toBe('Kieli');
  });

  it('keeps Crowdin German on its own catalog', () => {
    expect(de_DE.common.actions.save).toBe('Speichern');
  });
});
