import type { CatalogColumn, CatalogSort } from '@tahti-player/ui';

import { formatLibrarySize } from '../lib/libraryFormat';
import type {
  NativeLibraryTrack,
  NativeSortColumn,
  NativeTrackSort,
} from '../lib/nativeLibrary';
import { formatDuration } from '../lib/playableToTrack';
import { TRACK_COLOR_CSS } from '../lib/trackColors';

const dash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

/** Column ids that double as the native sort column names. */
const SORTABLE = new Set<string>([
  'title',
  'artist',
  'album',
  'genre',
  'year',
  'trackNo',
  'duration',
  'format',
  'size',
  'bitrate',
  'added',
  'rating',
  'plays',
  'lastPlayed',
]);

export const NATIVE_TRACK_COLUMNS: CatalogColumn<NativeLibraryTrack>[] = [
  {
    id: 'title',
    header: 'Title',
    width: 260,
    sortable: true,
    required: true,
    render: (track) => (
      <span title={track.title}>
        {track.title}
        {!track.available ? (
          <span
            className="text-destructive ml-2 text-xs"
            title="Original file is missing"
          >
            Missing
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: 'artist',
    header: 'Artist',
    width: 180,
    sortable: true,
    render: (track) => track.artist || 'Unknown artist',
  },
  {
    id: 'album',
    header: 'Album',
    width: 180,
    sortable: true,
    render: (track) => dash(track.album),
  },
  {
    id: 'albumArtist',
    header: 'Album artist',
    width: 160,
    hiddenByDefault: true,
    render: (track) => dash(track.albumArtist),
  },
  {
    id: 'year',
    header: 'Year',
    width: 70,
    sortable: true,
    align: 'right',
    render: (track) => dash(track.year),
  },
  {
    id: 'genre',
    header: 'Genre',
    width: 130,
    sortable: true,
    render: (track) => dash(track.genre),
  },
  {
    id: 'trackNo',
    header: 'Track #',
    width: 80,
    sortable: true,
    align: 'right',
    hiddenByDefault: true,
    render: (track) => dash(track.trackNo),
  },
  {
    id: 'duration',
    header: 'Time',
    width: 80,
    sortable: true,
    align: 'right',
    render: (track) => (track.duration ? formatDuration(track.duration) : '—'),
  },
  {
    id: 'format',
    header: 'Format',
    width: 80,
    sortable: true,
    render: (track) => track.format.toUpperCase(),
  },
  {
    id: 'bitrate',
    header: 'Bitrate',
    width: 100,
    sortable: true,
    align: 'right',
    hiddenByDefault: true,
    render: (track) => (track.bitrateKbps ? `${track.bitrateKbps} kbps` : '—'),
  },
  {
    id: 'size',
    header: 'Size',
    width: 90,
    sortable: true,
    align: 'right',
    render: (track) => formatLibrarySize(track.sizeBytes),
  },
  {
    id: 'rating',
    header: 'Rating',
    width: 100,
    sortable: true,
    render: (track) =>
      track.rating > 0 ? (
        <span
          title={`${track.rating} of 5 stars`}
          aria-label={`${track.rating} of 5 stars`}
        >
          {'★'.repeat(track.rating)}
          <span className="opacity-30">{'★'.repeat(5 - track.rating)}</span>
        </span>
      ) : (
        '—'
      ),
  },
  {
    id: 'color',
    header: 'Label',
    width: 90,
    hiddenByDefault: true,
    render: (track) =>
      track.color ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: TRACK_COLOR_CSS[track.color] }}
            aria-hidden
          />
          {track.color}
        </span>
      ) : (
        '—'
      ),
  },
  {
    id: 'plays',
    header: 'Plays',
    width: 70,
    sortable: true,
    align: 'right',
    hiddenByDefault: true,
    render: (track) => track.playCount || '—',
  },
  {
    id: 'lastPlayed',
    header: 'Last played',
    width: 120,
    sortable: true,
    hiddenByDefault: true,
    render: (track) => dash(track.lastPlayedAt?.slice(0, 10)),
  },
  {
    id: 'added',
    header: 'Date added',
    width: 120,
    sortable: true,
    hiddenByDefault: true,
    render: (track) => dash(track.addedAt.slice(0, 10)),
  },
];

export function toNativeSort(sort: CatalogSort | null): NativeTrackSort | null {
  if (!sort || !SORTABLE.has(sort.columnId)) {
    return null;
  }
  return {
    column: sort.columnId as NativeSortColumn,
    descending: sort.descending,
  };
}
