import { useNavigate } from '@tanstack/react-router';

import type { Track } from '@tahti-player/model';
import { TrackTable } from '@tahti-player/ui';

import type { StudioReleaseTrack } from '../../../api/studio-types';
import type { TahtiPlayable } from '../../../api/types';
import { trackTableLabels } from '../../../lib/trackTableLabels';
import { usePlayerStore } from '../../../stores/playerStore';

type Props = {
  releaseId: string;
  releaseTracks: StudioReleaseTrack[];
  rows: Track[];
  buildPlayable: (track: StudioReleaseTrack) => Promise<TahtiPlayable | null>;
};

export function ReleaseTracksTable({
  releaseId,
  releaseTracks,
  rows,
  buildPlayable,
}: Props) {
  const navigate = useNavigate();
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);
  const play = usePlayerStore((state) => state.play);
  const enqueue = usePlayerStore((state) => state.enqueue);

  const releaseTrackFor = (track: Track) =>
    releaseTracks.find((candidate) => candidate.id === track.source.id);
  const isActive = (track: Track) => {
    const rt = releaseTrackFor(track);
    return Boolean(rt?.soundId && currentId === `sound:${rt.soundId}`);
  };
  const isAudible =
    playbackStatus === 'playing' || playbackStatus === 'loading';

  return (
    <TrackTable
      tracks={rows}
      labels={trackTableLabels}
      getItemId={(_t, index) => releaseTracks[index]?.id ?? String(index)}
      features={{
        header: true,
        reorderable: false,
        filterable: true,
        sortable: false,
      }}
      display={{
        displayPosition: false,
        displayArtist: false,
        displayDuration: true,
        displayDeleteButton: false,
        displayThumbnail: true,
        displayQueueControls: true,
      }}
      actions={{
        onPlayNow: (track) => {
          const rt = releaseTrackFor(track);
          if (!rt) {
            return;
          }
          if (currentId === `sound:${rt.soundId}`) {
            setPlaybackStatus(isAudible ? 'paused' : 'playing');
          } else {
            void buildPlayable(rt).then((playable) => {
              if (playable) {
                play(playable);
              }
            });
          }
        },
        onAddToQueue: (track) => {
          const rt = releaseTrackFor(track);
          if (rt) {
            void buildPlayable(rt).then((playable) => {
              if (playable) {
                enqueue(playable);
              }
            });
          }
        },
        onEdit: (track) => {
          const soundId = releaseTrackFor(track)?.soundId;
          if (soundId) {
            void navigate({
              to: '/studio/sounds/$id/editor',
              params: { id: soundId },
            });
          }
        },
        onOpenDetail: (track) => {
          void navigate({
            to: '/studio/insights/$kind/$id',
            params: { kind: 'release-tracks', id: track.source.id },
            search: { release: releaseId },
          });
        },
      }}
      meta={{
        canEditTrack: (track) => Boolean(releaseTrackFor(track)?.soundId),
        canOpenDetail: () => true,
        isCurrentTrack: isActive,
        isTrackPlaying: (track) => isActive(track) && isAudible,
      }}
    />
  );
}
