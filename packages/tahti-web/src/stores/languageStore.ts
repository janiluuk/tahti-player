import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  applyLocale,
  browserLocale,
  isWebLocale,
  type WebLocale,
} from '../lib/locale';

export const LANGUAGE_STORAGE_KEY = 'tahti-language';

/** A language picked in Settings, or `auto` to follow the browser. */
export type LanguageChoice = WebLocale | 'auto';

const resolve = (choice: LanguageChoice): WebLocale =>
  choice === 'auto' ? browserLocale() : choice;

type LanguageState = {
  choice: LanguageChoice;
  /** The language in use: the pick, or the browser's when on `auto`. */
  locale: WebLocale;
  setChoice: (choice: LanguageChoice) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      choice: 'auto',
      locale: browserLocale(),
      setChoice: async (choice) => {
        const locale = resolve(choice);
        set({ choice, locale });
        await applyLocale(locale);
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      partialize: (state) => ({ choice: state.choice }),
      merge: (persisted, current) => {
        const saved = persisted as
          { choice?: unknown; locale?: unknown } | undefined;
        const choice: LanguageChoice | null =
          saved?.choice === 'auto' || isWebLocale(saved?.choice)
            ? (saved.choice as LanguageChoice)
            : isWebLocale(saved?.locale)
              ? saved.locale
              : null;
        return choice
          ? { ...current, choice, locale: resolve(choice) }
          : current;
      },
    },
  ),
);

/** Applies the saved (or browser) language at boot. A failed Finnish chunk
 * fetch leaves the app in English rather than blocking the mount. */
export function applyStoredLanguage(): Promise<void> {
  return applyLocale(useLanguageStore.getState().locale).catch(() => {});
}
