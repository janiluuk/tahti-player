import type { TFunction } from '@tahti-player/i18n';
import type { SelectOption } from '@tahti-player/ui';

export function playlistTrackOrderOptions(t: TFunction<'web'>): SelectOption[] {
  return [
    {
      id: 'MANUAL',
      label: t('studioPlaylistEditorViewMore.manualTracklistOrder'),
    },
    { id: 'TIME_DESC', label: t('sortSounds.mode.NEWEST') },
    { id: 'TIME', label: t('studioPlaylistEditorViewMore.oldestFirst') },
    { id: 'NAME', label: t('studioPlaylistEditorViewMore.titleAZ') },
    { id: 'NAME_DESC', label: t('sortSounds.mode.TITLE_DESC') },
  ];
}
