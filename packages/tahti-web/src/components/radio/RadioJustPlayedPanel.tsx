import { i18n, useTranslation } from '@tahti-player/i18n';

import type { RadioRecentlyPlayedItem, TahtiPlayable } from '../../api/types';
import { PageEmpty, PageError, PageErrorBanner } from '../PageStates';
import { RadioTrackTable } from './RadioTrackTable';

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
      <RadioTrackTable
        rows={items.map((item) => {
          const playable: TahtiPlayable | null =
            item.audioUrl && item.soundId
              ? {
                  id: `sound:${item.soundId}`,
                  kind: 'sound',
                  title: item.title,
                  artist: item.artistName,
                  coverUrl: item.artworkUrl ?? undefined,
                  peaks: item.peaks ?? null,
                  streamUrl: item.audioUrl,
                  protocol: 'https',
                }
              : null;
          const current = Boolean(
            playable && playable.id === handlers.currentId,
          );
          const playing =
            current && ['playing', 'loading'].includes(handlers.playerStatus);
          return {
            ...item,
            artworkSeed: item.soundId ?? item.id,
            current,
            playing,
            annotation: formatRadioAgo(item.playedAt),
            onPlay: playable
              ? () =>
                  current ? handlers.onTogglePause() : handlers.onPlay(playable)
              : undefined,
            onInfo: () => handlers.onTrackInfo(item, playable),
            onQueue: playable ? () => handlers.onQueue(playable) : undefined,
          };
        })}
      />
    </div>
  );
}
