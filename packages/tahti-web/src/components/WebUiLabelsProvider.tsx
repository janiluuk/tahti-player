import { useMemo, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { UiLabelsProvider, type UiLabels } from '@tahti-player/ui';

export function WebUiLabelsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('web');
  const labels = useMemo<UiLabels>(
    () => ({
      close: t('uiLabels.close'),
      copy: t('uiLabels.copy'),
      copied: t('uiLabels.copied'),
      copiedToClipboard: t('uiLabels.copiedToClipboard'),
      copyFailed: t('uiLabels.copyFailed'),
      edit: t('uiLabels.edit'),
      doneEditing: t('uiLabels.doneEditing'),
    }),
    [t],
  );
  return <UiLabelsProvider value={labels}>{children}</UiLabelsProvider>;
}
