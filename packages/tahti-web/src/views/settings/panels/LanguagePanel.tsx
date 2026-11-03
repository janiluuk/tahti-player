import { useTranslation } from '@tahti-player/i18n';
import { Select } from '@tahti-player/ui';

import { isWebLocale, WEB_LOCALES } from '../../../lib/locale';
import { useLanguageStore } from '../../../stores/languageStore';

const LANGUAGE_OPTIONS = WEB_LOCALES.map((locale) => ({
  id: locale.code,
  label: locale.nativeLabel,
}));

export function LanguagePanel() {
  const { t } = useTranslation('web');
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);

  return (
    <div className="flex w-full max-w-xl flex-col" data-testid="language-panel">
      <Select
        label={t('language.label')}
        description={t('language.description')}
        options={LANGUAGE_OPTIONS}
        value={locale}
        onValueChange={(value) => {
          if (isWebLocale(value)) {
            void setLocale(value);
          }
        }}
      />
    </div>
  );
}
