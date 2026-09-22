import { toast } from 'sonner';

import type { CatalogColumn } from '@tahti-player/ui';

import { formatTotalDuration, pluralTracks } from '../../lib/libraryFormat';
import type {
  NativePlaylistEntry,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { preparePlayables, shuffled } from '../../lib/nativePlayback';
import { formatDuration } from '../../lib/playableToTrack';
import { usePlayerStore } from '../../stores/playerStore';

export const PLAYLIST_COLUMNS: CatalogColumn<NativePlaylistEntry>[] = [
  {
    id: 'position',
    header: '#',
    width: 56,
    align: 'right',
    render: (entry) => entry.position + 1,
  },
  {
    id: 'title',
    header: 'Title',
    width: 280,
    required: true,
    render: (entry) => (
      <span title={entry.path}>
        {entry.title}
        {entry.unavailable ? (
          <span
            className="text-destructive ml-2 text-xs"
            title={
              entry.track
                ? 'The original file is missing'
                : 'This track is no longer in your library'
            }
          >
            Unavailable
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: 'artist',
    header: 'Artist',
    width: 200,
    render: (entry) => entry.artist || 'Unknown artist',
  },
  {
    id: 'album',
    header: 'Album',
    width: 180,
    hiddenByDefault: true,
    render: (entry) => entry.track?.album || '—',
  },
  {
    id: 'duration',
    header: 'Time',
    width: 80,
    align: 'right',
    render: (entry) => (entry.duration ? formatDuration(entry.duration) : '—'),
  },
];

export function summaryLine(playlist: NativePlaylistSummary) {
  const parts = [
    pluralTracks(playlist.trackCount),
    formatTotalDuration(playlist.durationSec),
  ];
  if (playlist.unavailableCount) {
    parts.push(`${playlist.unavailableCount} unavailable`);
  }
  return parts.join(' · ');
}

/** Turns a playlist's linked tracks into a queue and starts it. */
export async function playPlaylist(
  library: TahtiNativeLibrary,
  id: string,
  options: { shuffle?: boolean; startAtLinked?: number } = {},
) {
  const trackIds = await library.playlists.trackIds(id);
  if (trackIds.length === 0) {
    toast.error('None of this playlist’s tracks can be played.');
    return;
  }
  const ordered = options.shuffle ? shuffled(trackIds) : trackIds;
  const playables = await preparePlayables(library, ordered, 'playlist');
  const start = options.startAtLinked ?? 0;
  const [head, ...rest] = options.shuffle
    ? playables
    : [...playables.slice(start), ...playables.slice(0, start)];
  if (!head) {
    toast.error('None of this playlist’s tracks can be played.');
    return;
  }
  usePlayerStore.getState().play(head, { enqueueRest: rest });
}
