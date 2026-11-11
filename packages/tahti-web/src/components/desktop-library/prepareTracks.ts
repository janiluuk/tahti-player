import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import { addToPrepare } from '../../lib/mixableTracks';
import { getNativeLibrary } from '../../lib/nativeLibrary';
import { PREPARE_PLAYLIST_NAME } from '../../stores/djPrefsStore';

export async function prepareTracks(ids: string[]) {
  const library = getNativeLibrary();
  if (!library || ids.length === 0) {
    return;
  }
  try {
    const { playlistName, created } = await addToPrepare(
      library,
      ids,
      PREPARE_PLAYLIST_NAME,
    );
    toast.success(
      i18n.t('web:prepareTracksLeftovers.addedTo', {
        what:
          ids.length === 1
            ? i18n.t('web:prepareTracksLeftovers.track')
            : i18n.t('web:prepareTracksLeftovers.tracksAdded', {
                count: ids.length,
              }),
        playlist: playlistName,
        created: created
          ? i18n.t('web:prepareTracksLeftovers.newPlaylist')
          : '',
      }),
    );
  } catch (failure) {
    toast.error(
      failure instanceof Error
        ? failure.message
        : i18n.t('web:prepareTracksLeftovers.couldNotAddToPrepare'),
    );
  }
}
