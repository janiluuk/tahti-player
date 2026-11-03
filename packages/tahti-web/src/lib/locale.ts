import {
  DEFAULT_LOCALE,
  i18n,
  SUPPORTED_LOCALES,
  toBcp47,
} from '@tahti-player/i18n';

/** The player catalog ships more languages, but only these two cover
 * tahti-web's own strings; the others would show English chrome. */
export const WEB_LOCALES = SUPPORTED_LOCALES.filter(
  (locale) => locale.code === 'en_US' || locale.code === 'fi_FI',
);

export type WebLocale = (typeof WEB_LOCALES)[number]['code'];

export function isWebLocale(value: unknown): value is WebLocale {
  return WEB_LOCALES.some((locale) => locale.code === value);
}

export async function applyLocale(locale: WebLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = toBcp47(locale);
  }
}

export function currentLocale(): WebLocale {
  return isWebLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
}
