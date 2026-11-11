import { toast } from 'sonner';

import { i18n, type TFunction } from '@tahti-player/i18n';
import { Tooltip, type CatalogColumn } from '@tahti-player/ui';

import { formatTotalDuration, pluralTracks } from '../../lib/libraryFormat';
import type {
  NativePlaylistEntry,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { preparePlayables, shuffled } from '../../lib/nativePlayback';
import { formatDuration } from '../../lib/playableToTrack';
import { usePlayerStore } from '../../stores/playerStore';

function unavailableReason(entry: NativePlaylistEntry): string {
  return entry.track
    ? i18n.t('web:localPlaylistsSharedStates.fileMissing')
    : i18n.t('web:localPlaylistsSharedStates.notInLibrary');
}

export const playlistColumns = (
  t: TFunction<'web'>,
): CatalogColumn<NativePlaylistEntry>[] => [
  {
    id: 'position',
    header: '#',
    width: 56,
    align: 'right',
    render: (entry) => entry.position + 1,
  },
  {
    id: 'title',
    header: t('localPlaylistsSharedStates.title'),
    width: 280,
    required: true,
    render: (entry) => (
      <span title={entry.path}>
        {entry.title}
        {entry.unavailable ? (
          <Tooltip
            content={unavailableReason(entry)}
            side="top"
            wrapperClassName="ml-2 inline-flex"
          >
            <span
              className="text-accent-red-strong text-xs"
              aria-description={unavailableReason(entry)}
            >
              {i18n.t('web:localPlaylistsSharedText.unavailable')}
            </span>
          </Tooltip>
        ) : null}
      </span>
    ),
  },
  {
    id: 'artist',
    header: t('localPlaylistsSharedStates.artist'),
    width: 200,
    render: (entry) =>
      entry.artist || t('localPlaylistsSharedStates.unknownArtist'),
  },
  {
    id: 'album',
    header: t('localPlaylistsSharedStates.album'),
    width: 180,
    hiddenByDefault: true,
    render: (entry) => entry.track?.album || '—',
  },
  {
    id: 'duration',
    header: t('localPlaylistsSharedStates.time'),
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
    parts.push(
      i18n.t('web:localPlaylistsSharedStates.unavailableCount', {
        count: playlist.unavailableCount,
      }),
    );
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
    toast.error(i18n.t('web:toasts.nonePlaylistTracksPlayable'));
    return;
  }
  const ordered = options.shuffle ? shuffled(trackIds) : trackIds;
  const playables = await preparePlayables(library, ordered, 'playlist');
  const start = options.startAtLinked ?? 0;
  const [head, ...rest] = options.shuffle
    ? playables
    : [...playables.slice(start), ...playables.slice(0, start)];
  if (!head) {
    toast.error(i18n.t('web:toasts.nonePlaylistTracksPlayable'));
    return;
  }
  usePlayerStore.getState().play(head, { enqueueRest: rest });
}
