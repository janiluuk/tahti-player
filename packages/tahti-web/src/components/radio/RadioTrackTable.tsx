import type { Track } from '@tahti-player/model';
import { TrackTable } from '@tahti-player/ui';

import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { trackTableLabels } from '../../lib/trackTableLabels';

export type RadioTrackRow = {
  id: string;
  title: string;
  artistName: string;
  artworkUrl: string | null;
  artworkSeed?: string;
  current?: boolean;
  playing?: boolean;
  annotation?: string;
  onPlay?: () => void;
  onInfo?: () => void;
  onQueue?: () => void;
};

type RadioTrack = Track & { radio: RadioTrackRow };

export function RadioTrackTable({ rows }: { rows: RadioTrackRow[] }) {
  const tracks: RadioTrack[] = rows.map((row) => ({
    title: row.title,
    artists: [{ name: row.artistName, roles: ['performer'] }],
    artwork: {
      items: [
        {
          url:
            row.artworkUrl ?? placeholderArtworkUrl(row.artworkSeed ?? row.id),
          purpose: 'cover',
        },
      ],
    },
    source: { provider: 'tahti', id: row.id },
    radio: row,
  }));
  return (
    <TrackTable
      tracks={tracks}
      rowHeight={66}
      labels={trackTableLabels}
      classes={{
        root: 'border-x-0 border-t-0 [&_th:first-child]:w-16',
        header: 'bg-background-secondary text-foreground',
      }}
      features={{
        header: true,
        filterable: false,
        sortable: false,
        favorites: false,
        contextMenu: false,
      }}
      display={{
        displayThumbnail: true,
        displayArtist: true,
        displayDuration: false,
        displayQueueControls: rows.some((row) =>
          Boolean(row.onQueue || row.onInfo),
        ),
      }}
      actions={{
        onAddToQueue: rows.some((row) => row.onQueue)
          ? (track) => track.radio.onQueue?.()
          : undefined,
        onPlayNow: (track) => track.radio.onPlay?.(),
        onOpenDetails: (track) => track.radio.onInfo?.(),
        onOpenDetail: (track) => track.radio.onInfo?.(),
      }}
      meta={{
        canPlayTrack: (track) => Boolean(track.radio.onPlay),
        canOpenDetail: (track) => Boolean(track.radio.onInfo),
        isCurrentTrack: (track) => Boolean(track.radio.current),
        isTrackPlaying: (track) => Boolean(track.radio.playing),
        getTrackAnnotation: (track) => track.radio.annotation,
      }}
    />
  );
}
