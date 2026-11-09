import { useTranslation } from '@tahti-player/i18n';

import { useLanguageStore } from '../stores/languageStore';

export type ContentLocale = 'en' | 'fi';

export function contentLocaleOf(language: string | undefined): ContentLocale {
  return language?.toLowerCase().startsWith('fi') ? 'fi' : 'en';
}

/** Language for long-form content that ships in English and Finnish. */
export function useContentLocale(): ContentLocale {
  const { i18n } = useTranslation();
  return contentLocaleOf(i18n.language);
}

/** Switches the whole app language, the same as Settings → Language. */
export function setContentLocale(locale: ContentLocale): Promise<void> {
  return useLanguageStore
    .getState()
    .setChoice(locale === 'fi' ? 'fi_FI' : 'en_US');
}
