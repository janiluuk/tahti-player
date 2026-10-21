import type { BackendModule, ReadCallback, ResourceKey } from 'i18next';

import type { DEFAULT_LOCALE, LocaleCode } from './locales';

type Catalog = Record<string, ResourceKey>;
type CatalogModule = { default: Catalog };

export const localeLoaders: Record<
  Exclude<LocaleCode, typeof DEFAULT_LOCALE>,
  () => Promise<CatalogModule>
> = {
  fi_FI: () => import('./locales/fi_FI.json'),
  de_DE: () => import('./locales/de_DE.json'),
  es_ES: () => import('./locales/es_ES.json'),
  fr_FR: () => import('./locales/fr_FR.json'),
  it_IT: () => import('./locales/it_IT.json'),
  ja_JP: () => import('./locales/ja_JP.json'),
  pl_PL: () => import('./locales/pl_PL.json'),
  pt_BR: () => import('./locales/pt_BR.json'),
  ru_RU: () => import('./locales/ru_RU.json'),
  zh_CN: () => import('./locales/zh_CN.json'),
};

const pending = new Map<string, Promise<Catalog>>();

function isLazyLocale(
  language: string,
): language is keyof typeof localeLoaders {
  return Object.hasOwn(localeLoaders, language);
}

export function loadLocaleCatalog(language: string): Promise<Catalog> {
  if (!isLazyLocale(language)) {
    return Promise.resolve({});
  }
  let catalog = pending.get(language);
  if (!catalog) {
    catalog = localeLoaders[language]().then((module) => module.default);
    // A failed chunk fetch must not poison later switches back to this locale.
    catalog.catch(() => pending.delete(language));
    pending.set(language, catalog);
  }
  return catalog;
}

/**
 * i18next asks per (language, namespace); each locale is one JSON chunk, so
 * all namespaces of a language share a single import.
 */
export const lazyLocaleBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(language: string, namespace: string, callback: ReadCallback) {
    loadLocaleCatalog(language).then(
      (catalog) => callback(null, catalog[namespace] ?? {}),
      (error: unknown) =>
        callback(
          error instanceof Error ? error : new Error(String(error)),
          false,
        ),
    );
  },
};
