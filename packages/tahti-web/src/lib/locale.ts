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

/** The first browser language Tahti has a web catalog for, else English. */
export function browserLocale(
  languages: readonly string[] = typeof navigator === 'undefined'
    ? []
    : (navigator.languages ?? [navigator.language]),
): WebLocale {
  for (const language of languages) {
    const prefix = language.trim().split(/[-_]/)[0]?.toLowerCase();
    const match = WEB_LOCALES.find((locale) =>
      locale.code.toLowerCase().startsWith(`${prefix}_`),
    );
    if (prefix && match) {
      return match.code;
    }
  }
  return DEFAULT_LOCALE;
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

export function dateLocaleTag(): string {
  return toBcp47(currentLocale());
}
