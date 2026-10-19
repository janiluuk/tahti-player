import { Link } from '@tanstack/react-router';
import {
  BarChart3Icon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { AddToPlaylistButton } from '../../../components/AddToPlaylistButton';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from '../../../components/AmbientTrackList';
import { mockAmbientPeaks } from '../../../components/AmbientTrackRow';
import { useHearthisEmbedClaim } from '../../../components/HearthisEmbedHost';
import { HearthisEmbedSurface } from '../../../components/HearthisEmbedSurface';
import { StudioSoundRowMenu } from '../../../components/StudioSoundRowMenu';
import {
  canRetrySoundProcessing,
  useRetrySoundProcessing,
} from '../../../hooks/useRetrySoundProcessing';
import { EMBED_PROVIDER_LABEL, embedSrcFor } from '../../../lib/embedSrc';
import { isPinned } from '../../../lib/pinnedTracks';
import { formatDuration } from '../../../lib/playableToTrack';
import { usePlayerStore } from '../../../stores/playerStore';
import type { StudioSoundsState } from './useStudioSoundsState';

function formatUploadDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function SoundTitle({ item }: { item: StudioSound }) {
  return (
    <Link to="/t/$id" params={{ id: item.id }} className="hover:underline">
      {item.title}
    </Link>
  );
}

function SoundStatusLine({ item }: { item: StudioSound }) {
  const failed = item.status === 'ERROR';
  const embedSrc =
    item.embedProvider && item.embedUri
      ? embedSrcFor(item.embedProvider, item.embedUri)
      : null;
  return (
    <>
      <p className="text-foreground-secondary text-xs">
        {failed ? 'Processing failed' : item.status}
        {formatUploadDate(item.createdAt)
          ? `, uploaded ${formatUploadDate(item.createdAt)}`
          : ''}
        {isPinned(item) ? ', pinned' : ''}
        {item.durationSec != null
          ? `, ${Math.round(item.durationSec / 60)} min`
          : ''}
        {item.genre ? `, ${item.genre}` : ''}
        {item.isPublic === false ? ', private' : ''}
        {item.downloadsEnabled === false ? ', downloads off' : ''}
        {embedSrc ? `, via ${EMBED_PROVIDER_LABEL[item.embedProvider!]}` : ''}
      </p>
      {failed && item.processingError ? (
        <p className="text-accent-red-strong text-xs">{item.processingError}</p>
      ) : null}
    </>
  );
}

function SoundRowActions({
  item,
  state,
}: {
  item: StudioSound;
  state: StudioSoundsState;
}) {
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
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const hearthisActive =
    item.embedProvider === 'HEARTHIS' &&
    Boolean(item.embedUri) &&
    currentId === `sound:${item.id}`;
  const hearthisPlaying =
    hearthisActive &&
    (playerStatus === 'playing' || playerStatus === 'loading');
  useHearthisEmbedClaim(hearthisActive);

  return (
    <div
      className="relative flex max-w-full min-w-0 flex-wrap items-center gap-2"
      data-testid="sound-row-actions"
    >
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
          aria-label={
            embedSrc
              ? `Play ${item.title} on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
              : `Play ${item.title}`
          }
        >
          <PlayIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      {hearthisActive && item.embedUri ? (
        <div
          className="border-border relative max-h-28 w-[min(100%,18rem)] shrink overflow-hidden rounded-lg border contain-paint"
          data-testid="hearthis-row-embed"
        >
          <HearthisEmbedSurface
            embedUri={item.embedUri}
            title={item.title}
            autoplay={hearthisPlaying}
            compact
          />
        </div>
      ) : null}
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
    </div>
  );
}

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
  retry: {
    retry: (item: Pick<StudioSound, 'id' | 'title'>) => Promise<void>;
    retryingId: string | null;
  },
): AmbientTrackListItem {
  const { playItem, playEmbedItem } = state;
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

  const titleNode: ReactNode = <SoundTitle item={item} />;
  const belowTitle: ReactNode = (
    <>
      <SoundStatusLine item={item} />
      {canRetrySoundProcessing(item) ? (
        <Button
          size="xs"
          variant="secondary"
          disabled={retry.retryingId === item.id}
          onClick={() => void retry.retry(item)}
          aria-label={`Retry processing ${item.title}`}
          className="mt-1"
        >
          <RotateCcwIcon size={14} aria-hidden className="mr-1" />
          Retry
        </Button>
      ) : null}
    </>
  );

  return {
    id: item.id,
    trackId: playerId,
    title: item.title,
    titleNode,
    belowTitle,
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
    actions: <SoundRowActions item={item} state={state} />,
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
  const { retry, retryingId } = useRetrySoundProcessing((id) =>
    state.setItems((prev) =>
      prev.map((sound) =>
        sound.id === id
          ? { ...sound, status: 'PENDING', processingError: null }
          : sound,
      ),
    ),
  );
  const listItems = items.map((item) =>
    toListItem(item, state, playback, { retry, retryingId }),
  );

  return (
    <AmbientTrackList
      items={listItems}
      defaultDensity="comfortable"
      emptyMessage="No sounds match these filters."
    />
  );
}
