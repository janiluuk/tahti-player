import { useTranslation } from '@tahti-player/i18n';
import { Select } from '@tahti-player/ui';

import { browserLocale, isWebLocale, WEB_LOCALES } from '../../../lib/locale';
import { useLanguageStore } from '../../../stores/languageStore';

export function LanguagePanel() {
  const { t } = useTranslation('web');
  const choice = useLanguageStore((s) => s.choice);
  const setChoice = useLanguageStore((s) => s.setChoice);
  const browser = WEB_LOCALES.find((item) => item.code === browserLocale());
  const options = [
    {
      id: 'auto',
      label: t('language.auto', { language: browser?.nativeLabel ?? '' }),
    },
    ...WEB_LOCALES.map((item) => ({ id: item.code, label: item.nativeLabel })),
  ];

  return (
    <div className="flex w-full max-w-xl flex-col" data-testid="language-panel">
      <Select
        label={t('language.label')}
        description={t('language.description')}
        options={options}
        value={choice}
        onValueChange={(value) => {
          if (value === 'auto' || isWebLocale(value)) {
            void setChoice(value);
          }
        }}
      />
    </div>
  );
}
