import { Link } from '@tanstack/react-router';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, MediaArtwork } from '@tahti-player/ui';

import type { RadioRecentlyPlayedItem, TahtiPlayable } from '../../api/types';
import {
  MediaIconActions,
  playQueueFavoriteActions,
} from '../MediaIconActions';
import { PageEmpty, PageError, PageErrorBanner } from '../PageStates';

export function formatRadioAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) {
    return i18n.t('web:radio.agoJustNow');
  }
  if (mins < 60) {
    return i18n.t('web:radio.agoMinutes', { count: mins });
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return i18n.t('web:radio.agoHours', { count: hours });
  }
  return i18n.t('web:radio.agoDays', { count: Math.floor(hours / 24) });
}

export type RadioJustPlayedRowHandlers = {
  currentId: string | null;
  playerStatus: string;
  queueIds: ReadonlySet<string>;
  onPlay: (playable: TahtiPlayable) => void;
  onTogglePause: () => void;
  onQueue: (playable: TahtiPlayable) => void;
  onTrackInfo: (
    item: RadioRecentlyPlayedItem,
    playable: TahtiPlayable | null,
  ) => void;
};

/** Tahti Radio → Just played: recent rotation / relay tracks with replay. */
export function RadioJustPlayedPanel({
  items,
  error,
  onRetry,
  handlers,
}: {
  items: RadioRecentlyPlayedItem[];
  error?: string;
  onRetry: () => void;
  handlers: RadioJustPlayedRowHandlers;
}) {
  const { t } = useTranslation('web');

  if (error && items.length === 0) {
    return (
      <PageError
        title={t('radio.recentLoadError')}
        description={error}
        onRetry={onRetry}
      />
    );
  }
  if (items.length === 0) {
    return <PageEmpty title={t('radio.recentEmpty')} />;
  }

  return (
    <div className="flex flex-col gap-3" data-testid="radio-just-played">
      {error ? (
        <PageErrorBanner
          title={t('radio.recentRefreshError')}
          description={error}
          onRetry={onRetry}
        />
      ) : null}
      <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
        {items.map((item) => {
          const playable: TahtiPlayable | null =
            item.audioUrl && item.soundId
              ? {
                  id: `sound:${item.soundId}`,
                  kind: 'sound',
                  title: item.title,
                  artist: item.artistName,
                  coverUrl: item.artworkUrl ?? undefined,
                  streamUrl: item.audioUrl,
                  protocol: 'https',
                }
              : null;
          const isPlaying = Boolean(
            playable && playable.id === handlers.currentId,
          );
          const isActivelyPlaying =
            isPlaying &&
            (handlers.playerStatus === 'playing' ||
              handlers.playerStatus === 'loading');
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 border-l-4 px-3 py-2 transition-colors ${
                isPlaying
                  ? 'border-l-accent-cyan bg-accent-cyan/10'
                  : 'border-l-transparent'
              }`}
            >
              <Button
                type="button"
                variant="text"
                size="flexible"
                onClick={() => handlers.onTrackInfo(item, playable)}
                aria-label={t('radio.trackInfoFor', { title: item.title })}
                className="shrink-0 p-0"
              >
                <MediaArtwork
                  size="sm"
                  src={item.artworkUrl}
                  alt=""
                  className="bg-surface-secondary rounded-md text-[10px] font-bold"
                  placeholder={item.title.slice(0, 2).toUpperCase()}
                />
              </Button>
              <div className="min-w-0 flex-1">
                <Link
                  to="/t/$id"
                  params={{ id: item.id }}
                  className={`block truncate text-sm leading-6 font-medium underline-offset-2 hover:underline ${
                    isPlaying ? 'text-accent-cyan-strong' : ''
                  }`}
                >
                  {item.title}
                </Link>
                <div className="text-foreground-secondary truncate text-xs">
                  {item.artistName}
                </div>
              </div>
              <span className="text-foreground-secondary hidden shrink-0 text-xs sm:inline">
                {formatRadioAgo(item.playedAt)}
              </span>
              <MediaIconActions
                actions={playQueueFavoriteActions({
                  itemName: item.title,
                  onPlay: () => playable && handlers.onPlay(playable),
                  onTogglePause: handlers.onTogglePause,
                  isPlaying: isActivelyPlaying,
                  onQueue: () => playable && handlers.onQueue(playable),
                  playDisabled: !playable,
                  queueDisabled: !playable,
                  playLabel: t('actions.playItem', { title: item.title }),
                  queueLabel: t('actions.queueItem', { title: item.title }),
                  queued: Boolean(
                    playable && handlers.queueIds.has(playable.id),
                  ),
                })}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
