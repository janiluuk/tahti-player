import './types';

export { default as i18n } from './i18n';
export { useTranslation } from 'react-i18next';
export type { ParseKeys, TFunction } from 'i18next';
export {
  DEFAULT_LOCALE,
  isLocaleCode,
  matchBrowserLocales,
  SUPPORTED_LOCALES,
  toBcp47,
  type LocaleCode,
} from './locales';
