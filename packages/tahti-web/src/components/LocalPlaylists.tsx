import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { PlaylistsBrowser } from './local-playlists/PlaylistsBrowser';
import { PlaylistView } from './local-playlists/PlaylistView';

export { PLAYLIST_COLUMNS } from './local-playlists/shared';

type Props = {
  library: TahtiNativeLibrary;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
};

/** The Playlists tab of Local files: list of playlists, or one opened. */
export function LocalPlaylists({ library, openId, onOpenChange }: Props) {
  return openId ? (
    <PlaylistView
      library={library}
      id={openId}
      onBack={() => onOpenChange(null)}
    />
  ) : (
    <PlaylistsBrowser library={library} onOpen={onOpenChange} />
  );
}
