import { FC, useMemo } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import type { Track } from '@tahti-player/model';
import { TrackTable } from '@tahti-player/ui';

import type { AdminSelectsItem } from '../api/admin';
import { trackTableLabels } from '../lib/trackTableLabels';
import { usePlayerStore } from '../stores/playerStore';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const formatTotalDuration = (seconds: number) => {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const toTrack = (item: AdminSelectsItem): Track => ({
  title: item.title,
  artists: [{ name: item.artistName, roles: ['performer'] }],
  durationMs: item.durationSec == null ? undefined : item.durationSec * 1000,
  source: { provider: 'tahti', id: item.id },
});

type TahtiRotationPlaylistEditorProps = {
  items: AdminSelectsItem[];
  onReorder: (items: AdminSelectsItem[]) => void;
  onRemove: (item: AdminSelectsItem) => void;
  onPreview: (item: AdminSelectsItem) => void;
  readOnly?: boolean;
  busy?: boolean;
  nowPlayingItemId?: string | null;
};

export const TahtiRotationPlaylistEditor: FC<
  TahtiRotationPlaylistEditorProps
> = ({
  items,
  onReorder,
  onRemove,
  onPreview,
  readOnly = false,
  busy = false,
  nowPlayingItemId = null,
}) => {
  const { t } = useTranslation('web');
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const tracks = useMemo(() => items.map(toTrack), [items]);
  const totalSeconds = items.reduce(
    (total, item) => total + (item.durationSec ?? 0),
    0,
  );
  const interactive = !readOnly && !busy;

  return (
    <div className="flex flex-col gap-3" aria-busy={busy || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">
          {t('tahtiRotationPlaylistEditorText.trackCount', {
            count: items.length,
          })}
        </span>
        <span className="text-foreground-secondary font-mono">
          {t('tahtiRotationPlaylistEditorText.totalDuration', {
            duration: formatTotalDuration(totalSeconds),
          })}
        </span>
      </div>
      <TrackTable
        aria-label={t(
          'tahtiRotationPlaylistEditorText.tahtiRadioRotationPlaylist',
        )}
        tracks={tracks}
        labels={trackTableLabels}
        getItemId={(_track, index) => items[index]?.id ?? String(index)}
        features={{
          header: true,
          reorderable: interactive,
          filterable: false,
          sortable: false,
        }}
        display={{
          displayPosition: true,
          displayArtist: true,
          displayDuration: true,
          displayDeleteButton: interactive,
          displayQueueControls: interactive,
          displayThumbnail: false,
        }}
        meta={{
          isCurrentTrack: (track) => {
            const item = items.find(
              (candidate) => candidate.id === track.source.id,
            );
            if (!item) {
              return false;
            }
            if (nowPlayingItemId && item.id === nowPlayingItemId) {
              return true;
            }
            return currentId === `sound:${item.soundId}`;
          },
          isTrackPlaying: (track) => {
            const item = items.find(
              (candidate) => candidate.id === track.source.id,
            );
            if (!item) {
              return false;
            }
            return (
              currentId === `sound:${item.soundId}` &&
              (playbackStatus === 'playing' || playbackStatus === 'loading')
            );
          },
        }}
        actions={{
          onReorder: (fromIndex, toIndex) => {
            if (!interactive) {
              return;
            }
            const next = [...items];
            const [moved] = next.splice(fromIndex, 1);
            if (!moved) {
              return;
            }
            next.splice(toIndex, 0, moved);
            onReorder(next);
          },
          onRemove: (_track, index) => {
            if (!interactive) {
              return;
            }
            const item = items[index];
            if (item) {
              onRemove(item);
            }
          },
          onPlayNow: (track) => {
            const item = items.find(
              (candidate) => candidate.id === track.source.id,
            );
            if (item) {
              onPreview(item);
            }
          },
        }}
      />
    </div>
  );
};
