import { Link } from '@tanstack/react-router';
import {
  BarChart3Icon,
  DownloadIcon,
  PencilIcon,
  RotateCcwIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Button,
  InlineError,
  Tooltip,
  TrackProcessing,
} from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { AddToPlaylistButton } from '../../../components/AddToPlaylistButton';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from '../../../components/AmbientTrackList';
import { EmbedTrackRow } from '../../../components/EmbedTrackRow';
import { StudioSoundRowMenu } from '../../../components/StudioSoundRowMenu';
import {
  canRetrySoundProcessing,
  useRetrySoundProcessing,
} from '../../../hooks/useRetrySoundProcessing';
import {
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
  type EmbedProvider,
} from '../../../lib/embedSrc';
import { isPinned } from '../../../lib/pinnedTracks';
import { formatDuration } from '../../../lib/playableToTrack';
import { usePlayerStore } from '../../../stores/playerStore';
import { SoundsListTable } from './SoundsListTable';
import type { StudioSoundsState } from './useStudioSoundsState';

export function formatUploadDate(value: string | undefined): string | null {
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

function isEmbedSound(item: StudioSound): boolean {
  return Boolean(item.embedProvider && item.embedUri);
}

export function SoundTitle({ item }: { item: StudioSound }) {
  return (
    <Link to="/t/$id" params={{ id: item.id }} className="hover:underline">
      {item.title}
    </Link>
  );
}

function isProcessingSound(item: StudioSound): boolean {
  return (
    !item.embedProvider &&
    (item.status === 'PENDING' || item.status === 'PROCESSING')
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
        {isProcessingSound(item) ? (
          <TrackProcessing />
        ) : failed ? (
          'Processing failed'
        ) : (
          item.status
        )}
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
        <InlineError textSize="xs" announce={false}>
          {item.processingError}
        </InlineError>
      ) : null}
    </>
  );
}

/** Studio actions only — play lives on AmbientTrackRow (hosted) or EmbedTrackRow. */
function SoundRowActions({
  item,
  state,
}: {
  item: StudioSound;
  state: StudioSoundsState;
}) {
  const {
    busyId,
    downloadItem,
    togglePin,
    setEditingId,
    setStatsItem,
    setPendingDeleteItem,
  } = state;
  const hasEmbed = isEmbedSound(item);

  return (
    <div
      className="relative flex max-w-full min-w-0 flex-wrap items-center gap-2"
      data-testid="sound-row-actions"
    >
      {!hasEmbed ? (
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
        hasEmbed={hasEmbed}
        onTogglePin={() => void togglePin(item)}
        onDelete={() => setPendingDeleteItem(item)}
      />
    </div>
  );
}

function toHostedListItem(
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
  const peaks = item.peaks ?? null;

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
    durationSec: item.durationSec ?? null,
    peaks,
    progress,
    isPlaying,
    onPlay: isProcessingSound(item)
      ? undefined
      : () => {
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

function EmbedSoundCard({
  item,
  state,
}: {
  item: StudioSound;
  state: StudioSoundsState;
}) {
  const provider = item.embedProvider as EmbedProvider;
  const embedUri = item.embedUri!;

  return (
    <li className="flex flex-col gap-2" data-testid="sounds-embed-card">
      <EmbedTrackRow
        title={item.title}
        provider={provider}
        embedUri={embedUri}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-foreground-secondary min-w-0 flex-1 text-xs">
          <SoundTitle item={item} />
          <span className="text-foreground-secondary">
            {' '}
            · via {EMBED_PROVIDER_LABEL[provider]}
          </span>
        </p>
        <SoundRowActions item={item} state={state} />
      </div>
    </li>
  );
}

/** Library → Sounds: hosted tracks as ambient rows; embeds in their own list. */
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

  const hosted = items.filter((item) => !isEmbedSound(item));
  const embeds = items.filter(isEmbedSound);
  const listItems = hosted.map((item) =>
    toHostedListItem(item, state, playback, { retry, retryingId }),
  );

  return (
    <div className="flex flex-col gap-8">
      {hosted.length > 0 || embeds.length === 0 ? (
        <AmbientTrackList
          items={listItems}
          defaultDensity="comfortable"
          emptyMessage={
            embeds.length > 0
              ? 'No hosted sounds match these filters.'
              : 'No sounds match these filters.'
          }
          renderList={() => <SoundsListTable items={hosted} state={state} />}
        />
      ) : null}

      {embeds.length > 0 ? (
        <section
          className="flex flex-col gap-3"
          aria-labelledby="sounds-embeds-heading"
          data-testid="sounds-embeds-section"
        >
          <div>
            <h2
              id="sounds-embeds-heading"
              className="font-display text-lg font-bold tracking-tight"
            >
              Embeds
            </h2>
            <p className="text-foreground-secondary mt-1 text-sm">
              hearthis.at, Spotify, Mixcloud and Bandcamp play in the provider
              widget — listed separately so they are not mixed with hosted
              waveforms.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {embeds.map((item) => (
              <EmbedSoundCard key={item.id} item={item} state={state} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
