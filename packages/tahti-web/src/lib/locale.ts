import {
  DEFAULT_LOCALE,
  i18n,
  isLocaleCode,
  matchBrowserLocales,
  toBcp47,
  type LocaleCode,
} from '@tahti-player/i18n';

export const LANGUAGE_STORAGE_KEY = 'tahti-web-language';

function readStoredLocale(): LocaleCode | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLocaleCode(stored) ? stored : null;
}

export function detectLocale(
  languages: readonly string[] = typeof navigator === 'undefined'
    ? []
    : (navigator.languages ?? [navigator.language]),
): LocaleCode {
  return readStoredLocale() ?? matchBrowserLocales(languages);
}

export async function applyLocale(locale: LocaleCode): Promise<void> {
  await i18n.changeLanguage(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = toBcp47(locale);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  }
}

export function currentLocale(): LocaleCode {
  return isLocaleCode(i18n.language) ? i18n.language : DEFAULT_LOCALE;
}
