import { useTranslation } from '@nuclearplayer/i18n';
import { TrackTableLabels } from '@nuclearplayer/ui';

export const useTrackTableLabels = (): TrackTableLabels => {
  const { t } = useTranslation('trackTable');

  return {
    headers: {
      artist: t('headers.artist'),
      title: t('headers.title'),
      album: t('headers.album'),
      duration: t('headers.duration'),
    },
    favorite: t('favorite'),
    unfavorite: t('unfavorite'),
    play: t('play'),
    pause: t('pause'),
    playAll: t('playAll'),
    addAllToQueue: t('addAllToQueue'),
    addToQueue: t('addToQueue'),
    inQueue: t('inQueue'),
    trackOptions: t('trackOptions'),
    remove: t('remove'),
    filterPlaceholder: t('filterPlaceholder'),
  };
};
