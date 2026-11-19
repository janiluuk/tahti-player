import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { patchMeProfile } from '../api/studio-extras/profile';
import {
  applyLocale,
  browserLocale,
  isWebLocale,
  type WebLocale,
} from '../lib/locale';

export const LANGUAGE_STORAGE_KEY = 'tahti-language';

/** A language picked in Settings, or `auto` to follow the browser. */
export type LanguageChoice = WebLocale | 'auto';

/** API uiLocale (`en` | `fi`) ↔ player WebLocale (`en_US` | `fi_FI`). */
export function choiceToUiLocale(choice: LanguageChoice): 'en' | 'fi' | null {
  if (choice === 'auto') {
    return null;
  }
  if (choice === 'fi_FI') {
    return 'fi';
  }
  return 'en';
}

export function uiLocaleToChoice(
  uiLocale: 'en' | 'fi' | null | undefined,
): LanguageChoice | null {
  if (uiLocale === 'fi') {
    return 'fi_FI';
  }
  if (uiLocale === 'en') {
    return 'en_US';
  }
  if (uiLocale === null) {
    return 'auto';
  }
  return null;
}

const resolve = (choice: LanguageChoice): WebLocale =>
  choice === 'auto' ? browserLocale() : choice;

type LanguageState = {
  choice: LanguageChoice;
  /** The language in use: the pick, or the browser's when on `auto`. */
  locale: WebLocale;
  setChoice: (choice: LanguageChoice) => Promise<void>;
  /** Apply a choice from the API profile without re-PATCHing. */
  hydrateFromUiLocale: (
    uiLocale: 'en' | 'fi' | null | undefined,
  ) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      choice: 'auto',
      locale: browserLocale(),
      setChoice: async (choice) => {
        const locale = resolve(choice);
        set({ choice, locale });
        await applyLocale(locale);
        const uiLocale = choiceToUiLocale(choice);
        await patchMeProfile({ uiLocale }).catch(() => {});
      },
      hydrateFromUiLocale: async (uiLocale) => {
        const mapped = uiLocaleToChoice(uiLocale);
        if (!mapped) {
          return;
        }
        if (mapped === get().choice) {
          return;
        }
        const locale = resolve(mapped);
        set({ choice: mapped, locale });
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
