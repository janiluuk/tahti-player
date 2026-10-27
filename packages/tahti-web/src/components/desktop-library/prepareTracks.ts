import { toast } from 'sonner';

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
      `${ids.length === 1 ? 'Track' : `${ids.length} tracks`} added to ${playlistName}${created ? ' (new playlist)' : ''}.`,
    );
  } catch (failure) {
    toast.error(
      failure instanceof Error ? failure.message : 'Could not add to Prepare.',
    );
  }
}
