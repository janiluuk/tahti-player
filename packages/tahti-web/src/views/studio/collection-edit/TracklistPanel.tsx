import { EmptyState, TrackTable } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import { trackTableLabels } from '../../../lib/trackTableLabels';
import { NowPlayingBar } from './NowPlayingBar';
import type { CollectionEditState } from './useCollectionEditState';

export function TracklistPanel({
  state,
  isAlbumLike,
}: {
  state: CollectionEditState;
  isAlbumLike: boolean;
}) {
  const {
    items,
    tracks,
    nowPlayingItem,
    currentId,
    isPlaying,
    queue,
    enqueue,
    buildPlayable,
    togglePlayItem,
    onReorder,
    setPendingRemove,
  } = state;

  return (
    <StudioPanel
      title={isAlbumLike ? 'Tracklist' : 'Items'}
      description={`${items.length} track${items.length === 1 ? '' : 's'}`}
    >
      <div className="mb-3 flex flex-col gap-3">
        {nowPlayingItem?.sound && (
          <NowPlayingBar title={nowPlayingItem.sound.title} />
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState size="sm" title="No tracks yet — add sound items below." />
      ) : (
        <div className="min-h-[200px]">
          <TrackTable
            tracks={tracks}
            labels={trackTableLabels}
            getItemId={(_t, index) => items[index]?.id ?? String(index)}
            features={{
              header: true,
              reorderable: true,
              filterable: true,
              sortable: false,
            }}
            display={{
              displayPosition: false,
              displayArtist: false,
              displayDuration: true,
              displayDeleteButton: true,
              displayThumbnail: true,
              displayQueueControls: true,
            }}
            actions={{
              onReorder,
              onRemove: (t, index) => {
                const item = items[index];
                if (!item) {
                  return;
                }
                setPendingRemove({ id: item.id, title: t.title });
              },
              onPlayNow: (t) => {
                const item = items.find((i) => i.id === t.source.id);
                if (item) {
                  togglePlayItem(item);
                }
              },
              onAddToQueue: (t) => {
                const item = items.find((i) => i.id === t.source.id);
                if (item?.sound) {
                  void buildPlayable(item.sound).then((playable) => {
                    if (playable) {
                      enqueue(playable);
                    }
                  });
                }
              },
            }}
            meta={{
              isCurrentTrack: (track) => {
                const item = items.find(
                  (candidate) => candidate.id === track.source.id,
                );
                return Boolean(
                  item?.sound && currentId === `sound:${item.sound.id}`,
                );
              },
              isTrackPlaying: (track) => {
                const item = items.find(
                  (candidate) => candidate.id === track.source.id,
                );
                return Boolean(
                  item?.sound &&
                  currentId === `sound:${item.sound.id}` &&
                  isPlaying,
                );
              },
              isTrackQueued: (track) =>
                queue.some((queueItem) => {
                  const item = items.find(
                    (candidate) => candidate.id === track.source.id,
                  );
                  return (
                    queueItem.id === track.source.id ||
                    (item?.sound && queueItem.id === `sound:${item.sound.id}`)
                  );
                }),
            }}
          />
        </div>
      )}
    </StudioPanel>
  );
}
