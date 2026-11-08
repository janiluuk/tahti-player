import { ArrowUpDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip, TrackTable } from '@tahti-player/ui';

import { CollectionTrackList } from '../../../components/CollectionTrackList';
import { SortSoundsDialog } from '../../../components/SortSoundsDialog';
import { StudioPanel } from '../../../components/StudioPanel';
import { soundSortModeFromApi } from '../../../lib/sortSounds';
import { trackTableLabels } from '../../../lib/trackTableLabels';
import { useStudioContributions } from '../useStudioContributions';
import { NowPlayingBar } from './NowPlayingBar';
import type { CollectionEditState } from './useCollectionEditState';

export function TracklistPanel({
  state,
  isAlbumLike,
  editing = true,
}: {
  state: CollectionEditState;
  isAlbumLike: boolean;
  editing?: boolean;
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
    saveSoundOrder,
    trackSortMode,
  } = state;
  const { t } = useTranslation('web');
  const { rowHeight, getTrackAnnotation } = useStudioContributions(items);
  const [sortOpen, setSortOpen] = useState(false);
  const sortable = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.sound?.title ?? item.release?.title ?? item.id,
        date: item.sound?.createdAt ?? item.release?.releaseDate ?? null,
        artworkUrl: item.sound?.bannerUrl ?? item.release?.artworkUrl ?? null,
      })),
    [items],
  );

  return (
    <StudioPanel
      title={isAlbumLike ? 'Tracklist' : 'Items'}
      description={`${items.length} track${items.length === 1 ? '' : 's'}`}
      action={
        editing && items.length > 1 ? (
          <Tooltip content={t('sortSounds.open')} side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={t('sortSounds.open')}
              onClick={() => setSortOpen(true)}
            >
              <ArrowUpDownIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        ) : undefined
      }
    >
      <div className="mb-3 flex flex-col gap-3">
        {nowPlayingItem?.sound && (
          <NowPlayingBar title={nowPlayingItem.sound.title} />
        )}
      </div>

      {items.length === 0 ? (
        <CollectionTrackList
          items={[]}
          empty={{
            title: 'No tracks yet',
            description: editing
              ? 'Add sound items below.'
              : 'Click Edit to add tracks.',
          }}
        />
      ) : (
        <div className="min-h-[200px]">
          <TrackTable
            tracks={tracks}
            labels={trackTableLabels}
            rowHeight={rowHeight}
            getItemId={(_t, index) => items[index]?.id ?? String(index)}
            features={{
              header: true,
              reorderable: editing,
              filterable: true,
              sortable: false,
            }}
            display={{
              displayPosition: false,
              displayArtist: !isAlbumLike,
              displayDuration: true,
              displayDeleteButton: editing,
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
              getTrackAnnotation,
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
      <SortSoundsDialog
        isOpen={sortOpen}
        sounds={sortable}
        initialMode={soundSortModeFromApi(trackSortMode)}
        onSave={saveSoundOrder}
        onClose={() => setSortOpen(false)}
      />
    </StudioPanel>
  );
}
