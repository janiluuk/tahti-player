import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { lazyLocaleBackend } from './lazyLocales';
import { DEFAULT_LOCALE } from './locales';
import en_US from './locales/en_US.json';

export const resources = { en_US } as const;

i18n
  .use(lazyLocaleBackend)
  .use(initReactI18next)
  .init({
    showSupportNotice: false, // disables console.log advertisement spam
    resources,
    // Lets the backend fetch languages missing from `resources`; without it
    // i18next treats bundled resources as the complete set.
    partialBundledLanguages: true,
    load: 'currentOnly',
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    // Every catalog namespace, so a lazily loaded locale fetches all of them
    // on changeLanguage instead of only the ones a component has requested.
    ns: Object.keys(en_US),
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
