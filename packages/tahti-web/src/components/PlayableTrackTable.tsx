import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import type { Track } from '@tahti-player/model';
import { Button, Dialog, TrackTable } from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { playableToTrack } from '../lib/playableToTrack';
import { soundIdFromPlayableId } from '../lib/soundId';
import { trackTableLabels } from '../lib/trackTableLabels';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useTrackDetailStore } from '../stores/trackDetailStore';
import { PlayableTrackContextMenu } from './PlayableTrackContextMenu';

type Props = {
  items: TahtiPlayable[];
  emptyMessage?: string;
  playAll?: boolean;
  compactActions?: boolean;
  /** Present only when the caller has already decided the viewer can
   * edit these tracks (e.g. their own catalog) -- omit entirely to keep
   * the edit icon off tables of other people's/aggregated tracks. */
  onEdit?: (item: TahtiPlayable) => void;
};

export function PlayableTrackTable({
  items,
  emptyMessage = 'No tracks yet.',
  playAll = true,
  compactActions = false,
  onEdit,
}: Props) {
  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const [confirmAddAllOpen, setConfirmAddAllOpen] = useState(false);
  const rememberTrackDetail = useTrackDetailStore((s) => s.remember);

  if (items.length === 0) {
    return <p className="text-foreground-secondary text-sm">{emptyMessage}</p>;
  }

  const tracks: Track[] = items.map(playableToTrack);
  const byId = new Map(items.map((i) => [i.id, i]));

  const resolve = (track: Track): TahtiPlayable | null =>
    byId.get(track.source.id) ?? null;

  // The listener-facing track page (waveform, artwork, comments — see
  // TrackDetailView) is the default destination for both the title text
  // and the "Open track" action icon. Embed-only sources (hearthis.at,
  // etc.) have no internal detail page, so clicking the title falls back
  // to playing instead (matching TrackTable's own default when there's no
  // onOpenDetails handler at all).
  const openDetail = (track: Track) => {
    const item = resolve(track);
    if (!item) {
      return;
    }
    const soundId = soundIdFromPlayableId(track.source.id);
    if (soundId) {
      rememberTrackDetail(item);
      void navigate({ to: '/t/$id', params: { id: soundId } });
      return;
    }
    if (currentId === item.id) {
      setPlayerStatus(
        playerStatus === 'playing' || playerStatus === 'loading'
          ? 'paused'
          : 'playing',
      );
      return;
    }
    const rest = items.filter((i) => i.id !== item.id);
    play(item, { enqueueRest: rest });
  };

  const addAllToQueue = () => {
    const queuedIds = new Set(queue.map((queueItem) => queueItem.id));
    const newItems = items.filter((item) => !queuedIds.has(item.id));
    for (const item of newItems) {
      enqueue(item);
    }
    if (newItems.length === 0) {
      toast.info('All listed tracks are already in the queue.');
    } else {
      toast.success(
        `Added ${newItems.length} track${newItems.length === 1 ? '' : 's'} to the queue.`,
      );
    }
  };

  return (
    <>
      <div className="flex min-h-[240px] flex-col gap-3">
        <TrackTable
          tracks={tracks}
          labels={trackTableLabels}
          features={{
            header: true,
            filterable: true,
            sortable: true,
            favorites: true,
            playAll,
            addAllToQueue: true,
            reorderable: false,
            contextMenu: true,
          }}
          display={{
            displayThumbnail: true,
            displayFavorite: true,
            displayArtist: true,
            displayDuration: true,
            displayAlbum: items.some((i) =>
              Boolean(i.sourceProvider && i.sourceProvider !== 'tahti'),
            ),
            displayReleaseDate: items.some((i) => Boolean(i.releaseDate)),
            displayQueueControls: !compactActions,
            displayPosition: false,
          }}
          actions={{
            onPlayNow: (track) => {
              const item = resolve(track);
              if (!item) {
                return;
              }
              if (currentId === item.id) {
                setPlayerStatus(
                  playerStatus === 'playing' || playerStatus === 'loading'
                    ? 'paused'
                    : 'playing',
                );
                return;
              }
              const rest = items.filter((i) => i.id !== item.id);
              play(item, { enqueueRest: rest });
            },
            onOpenDetails: openDetail,
            onOpenDetail: openDetail,
            onAddToQueue: (track) => {
              const item = resolve(track);
              if (item) {
                if (queue.some((queueItem) => queueItem.id === item.id)) {
                  toast.info(`“${item.title}” is already in the queue.`);
                  return;
                }
                enqueue(item);
                toast.success(`Added “${item.title}” to the queue.`);
              }
            },
            onPlayAll: () => {
              const [head, ...rest] = items;
              if (head) {
                play(head, { enqueueRest: rest });
              }
            },
            onAddAllToQueue: () => setConfirmAddAllOpen(true),
            onToggleFavorite: (track) => {
              const item = resolve(track);
              if (item) {
                toggleFavoriteTrack(item);
              }
            },
            onEdit: onEdit
              ? (track) => {
                  const item = resolve(track);
                  if (item) {
                    onEdit(item);
                  }
                }
              : undefined,
          }}
          meta={{
            isTrackFavorite: (track) =>
              favoriteTracks.some((t) => t.id === track.source.id),
            isCurrentTrack: (track) => track.source.id === currentId,
            isTrackPlaying: (track) =>
              track.source.id === currentId &&
              (playerStatus === 'playing' || playerStatus === 'loading'),
            isTrackQueued: (track) =>
              queue.some((queueItem) => queueItem.id === track.source.id),
            canEditTrack: onEdit ? () => true : undefined,
            // Embed-only sources (hearthis.at, etc.) have no internal detail
            // page to open, so the icon is hidden for them rather than
            // rendering a dead link.
            canOpenDetail: (track) =>
              Boolean(soundIdFromPlayableId(track.source.id)),
            ContextMenuWrapper: PlayableTrackContextMenu,
          }}
        />
      </div>
      <Dialog.Root
        isOpen={confirmAddAllOpen}
        onClose={() => setConfirmAddAllOpen(false)}
      >
        <Dialog.Title>
          Add {items.length} track{items.length === 1 ? '' : 's'} to queue?
        </Dialog.Title>
        <Dialog.Description>
          This adds every track in this list to your play queue.
        </Dialog.Description>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            onClick={() => {
              addAllToQueue();
              setConfirmAddAllOpen(false);
            }}
          >
            Add to queue
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
