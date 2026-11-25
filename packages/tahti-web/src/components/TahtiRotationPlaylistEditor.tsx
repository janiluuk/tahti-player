import {
  ArrowDownIcon,
  ArrowDownToLineIcon,
  ArrowUpIcon,
  ArrowUpToLineIcon,
} from 'lucide-react';
import { createContext, FC, useContext, useMemo, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import type { Track } from '@tahti-player/model';
import { TrackContextMenu, TrackTable } from '@tahti-player/ui';

import type { AdminSelectsItem } from '../api/admin';
import { nextRotationItemId } from '../lib/radioRotationOnAir';
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

const toTrack = (item: AdminSelectsItem, index: number): Track => ({
  title: item.title,
  artists: [{ name: item.artistName, roles: ['performer'] }],
  durationMs: item.durationSec == null ? undefined : item.durationSec * 1000,
  trackNumber: index + 1,
  source: { provider: 'tahti', id: item.id },
});

type RowMenuContextValue = {
  ids: string[];
  move: (fromIndex: number, toIndex: number) => void;
};

const RowMenuContext = createContext<RowMenuContextValue>({
  ids: [],
  move: () => {},
});

/** Row menu that moves a track without dragging, for touch screens and
 * keyboards where the table's pointer drag does not work. */
const RotationRowMenu: FC<{ track: Track; children: ReactNode }> = ({
  track,
  children,
}) => {
  const { t } = useTranslation('web');
  const { ids, move } = useContext(RowMenuContext);
  const index = ids.indexOf(track.source.id);
  const last = ids.length - 1;
  const moves = [
    {
      key: 'top',
      label: t('tahtiRotationPlaylistEditorText.moveToTop'),
      icon: <ArrowUpToLineIcon size={16} aria-hidden />,
      to: 0,
    },
    {
      key: 'up',
      label: t('tahtiRotationPlaylistEditorText.moveUp'),
      icon: <ArrowUpIcon size={16} aria-hidden />,
      to: index - 1,
    },
    {
      key: 'down',
      label: t('tahtiRotationPlaylistEditorText.moveDown'),
      icon: <ArrowDownIcon size={16} aria-hidden />,
      to: index + 1,
    },
    {
      key: 'bottom',
      label: t('tahtiRotationPlaylistEditorText.moveToBottom'),
      icon: <ArrowDownToLineIcon size={16} aria-hidden />,
      to: last,
    },
  ];

  return (
    <TrackContextMenu>
      <TrackContextMenu.Trigger>{children}</TrackContextMenu.Trigger>
      <TrackContextMenu.Content>
        <TrackContextMenu.Header
          title={track.title}
          subtitle={track.artists[0]?.name}
        />
        {moves.map((entry) => (
          <TrackContextMenu.Action
            key={entry.key}
            icon={entry.icon}
            disabled={
              index < 0 || entry.to < 0 || entry.to > last || entry.to === index
            }
            data-testid={`rotation-move-${entry.key}`}
            onClick={() => move(index, entry.to)}
          >
            {entry.label}
          </TrackContextMenu.Action>
        ))}
      </TrackContextMenu.Content>
    </TrackContextMenu>
  );
};

type TahtiRotationPlaylistEditorProps = {
  items: AdminSelectsItem[];
  onReorder: (items: AdminSelectsItem[]) => void;
  onRemove: (item: AdminSelectsItem) => void;
  onPreview: (item: AdminSelectsItem) => void;
  readOnly?: boolean;
  busy?: boolean;
  /** The rotation entry on air; marks it and the entry after it. */
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
  const upNextItemId = nextRotationItemId(items, nowPlayingItemId);

  const move = (fromIndex: number, toIndex: number) => {
    if (!interactive || fromIndex === toIndex) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    next.splice(toIndex, 0, moved);
    onReorder(next);
  };

  const rowMenu: RowMenuContextValue = {
    ids: items.map((item) => item.id),
    move,
  };

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
      <RowMenuContext.Provider value={rowMenu}>
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
            getTrackAnnotation: (track) => {
              if (track.source.id === nowPlayingItemId) {
                return t('tahtiRotationPlaylistEditorText.onAir');
              }
              if (track.source.id === upNextItemId) {
                return t('tahtiRotationPlaylistEditorText.upNext');
              }
              return null;
            },
            ContextMenuWrapper: interactive ? RotationRowMenu : undefined,
          }}
          actions={{
            onReorder: move,
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
      </RowMenuContext.Provider>
    </div>
  );
};
