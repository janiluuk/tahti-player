import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_LOCALE } from '@tahti-player/i18n';

import { applyLocale, isWebLocale, type WebLocale } from '../lib/locale';

export const LANGUAGE_STORAGE_KEY = 'tahti-language';

type LanguageState = {
  /** English unless the listener picked another language in Settings. */
  locale: WebLocale;
  setLocale: (locale: WebLocale) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: async (locale) => {
        set({ locale });
        await applyLocale(locale);
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      partialize: (state) => ({ locale: state.locale }),
      merge: (persisted, current) => {
        const locale = (persisted as { locale?: unknown } | undefined)?.locale;
        return isWebLocale(locale) ? { ...current, locale } : current;
      },
    },
  ),
);

/** Applies the saved language at boot. A failed Finnish chunk fetch leaves
 * the app in English rather than blocking the mount. */
export function applyStoredLanguage(): Promise<void> {
  return applyLocale(useLanguageStore.getState().locale).catch(() => {});
}
