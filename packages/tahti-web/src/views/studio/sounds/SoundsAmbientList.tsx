import {
  BarChart3Icon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
} from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { AddToPlaylistButton } from '../../../components/AddToPlaylistButton';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from '../../../components/AmbientTrackList';
import { mockAmbientPeaks } from '../../../components/AmbientTrackRow';
import { StudioSoundRowMenu } from '../../../components/StudioSoundRowMenu';
import { EMBED_PROVIDER_LABEL, embedSrcFor } from '../../../lib/embedSrc';
import { formatDuration } from '../../../lib/playableToTrack';
import { usePlayerStore } from '../../../stores/playerStore';
import type { StudioSoundsState } from './useStudioSoundsState';

function toListItem(
  item: StudioSound,
  state: StudioSoundsState,
  playback: {
    currentId: string | null;
    status: string;
    currentTime: number;
    duration: number;
    seekTo: (sec: number) => void;
  },
): AmbientTrackListItem {
  const {
    busyId,
    playItem,
    playEmbedItem,
    downloadItem,
    togglePin,
    setEditingId,
    setStatsItem,
    setPendingDeleteItem,
  } = state;
  const embedSrc =
    item.embedProvider && item.embedUri
      ? embedSrcFor(item.embedProvider, item.embedUri)
      : null;
  const playerId = `sound:${item.id}`;
  const isCurrent = playback.currentId === playerId;
  const isPlaying =
    isCurrent &&
    (playback.status === 'playing' || playback.status === 'loading');
  const progress =
    isCurrent && playback.duration > 0
      ? playback.currentTime / playback.duration
      : 0;
  const peaks =
    item.peaks && item.peaks.length > 0
      ? item.peaks
      : mockAmbientPeaks(item.id.length);

  return {
    id: item.id,
    trackId: playerId,
    title: item.title,
    artist: item.artistName?.trim() || 'You',
    coverUrl: item.bannerUrl,
    genreLabel: item.genre ?? undefined,
    durationLabel:
      item.durationSec != null ? formatDuration(item.durationSec) : undefined,
    peaks,
    progress,
    isPlaying,
    onPlay: () => {
      if (embedSrc) {
        playEmbedItem(item);
        return;
      }
      void playItem(item.id, item.title);
    },
    onSeek:
      isCurrent && playback.duration > 0
        ? (fraction) => playback.seekTo(fraction * playback.duration)
        : undefined,
    actions: (
      <>
        <Tooltip
          content={
            embedSrc
              ? `Play on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
              : 'Play'
          }
          side="top"
        >
          <Button
            size="icon-sm"
            variant="text"
            disabled={busyId === item.id}
            onClick={() => {
              if (embedSrc) {
                playEmbedItem(item);
                return;
              }
              void playItem(item.id, item.title);
            }}
            aria-label={`Play ${item.title}`}
          >
            <PlayIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        {!item.embedProvider ? (
          <Tooltip content="Download original" side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={busyId === item.id}
              onClick={() => void downloadItem(item)}
              aria-label={`Download ${item.title}`}
            >
              <DownloadIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
        <Tooltip content="Edit track" side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={`Edit ${item.title}`}
            onClick={() => setEditingId(item.id)}
          >
            <PencilIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Stats" side="top">
          <Button
            size="icon-sm"
            variant="text"
            onClick={() => setStatsItem(item)}
            aria-label={`Show stats for ${item.title}`}
          >
            <BarChart3Icon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <AddToPlaylistButton soundId={item.id} trackTitle={item.title} />
        <StudioSoundRowMenu
          item={item}
          busy={busyId === item.id}
          hasEmbed={Boolean(embedSrc)}
          onTogglePin={() => void togglePin(item)}
          onDelete={() => setPendingDeleteItem(item)}
        />
      </>
    ),
  };
}

/** Library → Sounds list using ambient+waveform rows and a track-size control. */
export function SoundsAmbientList({
  items,
  state,
}: {
  items: StudioSound[];
  state: StudioSoundsState;
}) {
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const playback = { currentId, status, currentTime, duration, seekTo };
  const listItems = items.map((item) => toListItem(item, state, playback));

  return (
    <AmbientTrackList
      items={listItems}
      defaultDensity="comfortable"
      emptyMessage="No sounds match these filters."
    />
  );
}
