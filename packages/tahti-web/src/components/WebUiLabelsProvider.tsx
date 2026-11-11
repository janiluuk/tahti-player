import { useMemo, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { UiLabelsProvider, type UiLabels } from '@tahti-player/ui';

export function WebUiLabelsProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation('web');
  const language = i18n.language;
  const labels = useMemo<UiLabels>(() => {
    const numberFormat = new Intl.NumberFormat(language.replace('_', '-'));
    const n = (value: number) => numberFormat.format(value);
    return {
      close: t('uiLabels.close'),
      copy: t('uiLabels.copy'),
      copied: t('uiLabels.copied'),
      copiedToClipboard: t('uiLabels.copiedToClipboard'),
      copyFailed: t('uiLabels.copyFailed'),
      edit: t('uiLabels.edit'),
      doneEditing: t('uiLabels.doneEditing'),
      back: t('uiLabels.back'),
      forward: t('uiLabels.forward'),
      previous: t('uiLabels.previous'),
      next: t('uiLabels.next'),
      previousNamed: (name) => t('uiLabels.previousNamed', { name }),
      nextNamed: (name) => t('uiLabels.nextNamed', { name }),
      play: t('uiLabels.play'),
      pause: t('uiLabels.pause'),
      shuffleOn: t('uiLabels.shuffleOn'),
      shuffleOff: t('uiLabels.shuffleOff'),
      repeatOff: t('uiLabels.repeatOff'),
      repeatOne: t('uiLabels.repeatOne'),
      repeatAll: t('uiLabels.repeatAll'),
      clearFilter: t('uiLabels.clearFilter'),
      scrollLeft: t('uiLabels.scrollLeft'),
      scrollRight: t('uiLabels.scrollRight'),
      settings: t('uiLabels.settings'),
      backToSettingsSections: t('uiLabels.backToSettingsSections'),
      filterOptions: t('uiLabels.filterOptions'),
      selectableOptions: t('uiLabels.selectableOptions'),
      loading: t('uiLabels.loading'),
      clear: t('uiLabels.clear'),
      tableSettings: t('uiLabels.tableSettings'),
      rows: t('uiLabels.rows'),
      selectAllLoaded: t('uiLabels.selectAllLoaded'),
      allSelected: (total) => t('uiLabels.allSelected', { total: n(total) }),
      countSelected: (count) => t('uiLabels.countSelected', { n: n(count) }),
      selectAllCount: (total) =>
        t('uiLabels.selectAllCount', { total: n(total) }),
      loadedOf: (loaded, total) =>
        t('uiLabels.loadedOf', { loaded: n(loaded), total: n(total) }),
      resizeColumn: (name) => t('uiLabels.resizeColumn', { name }),
      selectRow: (name) => t('uiLabels.selectRow', { name }),
      deselectRow: (name) => t('uiLabels.deselectRow', { name }),
      selectAllRows: t('uiLabels.selectAllRows'),
      deselectAllRows: t('uiLabels.deselectAllRows'),
      editTrack: t('uiLabels.editTrack'),
      openTrack: t('uiLabels.openTrack'),
    };
  }, [t, language]);
  return <UiLabelsProvider value={labels}>{children}</UiLabelsProvider>;
}
