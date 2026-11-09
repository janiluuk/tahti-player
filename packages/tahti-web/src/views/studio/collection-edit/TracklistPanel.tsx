import { ListPlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, TrackTable } from '@tahti-player/ui';

import { CollectionSortSounds } from '../../../components/CollectionSortSounds';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { trackTableLabels } from '../../../lib/trackTableLabels';
import { useStudioContributions } from '../useStudioContributions';
import { NowPlayingBar } from './NowPlayingBar';
import type { CollectionEditState } from './useCollectionEditState';

export function TracklistPanel({
  state,
  isAlbumLike,
  editing = true,
  onAddTracks,
}: {
  state: CollectionEditState;
  isAlbumLike: boolean;
  editing?: boolean;
  onAddTracks?: () => void;
}) {
  const { t } = useTranslation('web');
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
    applySoundOrder,
    trackSortMode,
    slug,
  } = state;
  const { rowHeight, getTrackAnnotation } = useStudioContributions(items);

  return (
    <StudioPanel
      title={isAlbumLike ? 'Tracklist' : 'Items'}
      description={`${items.length} track${items.length === 1 ? '' : 's'}`}
      action={
        editing && items.length > 1 ? (
          <CollectionSortSounds
            slug={slug}
            items={items}
            trackSortMode={trackSortMode}
            onSaved={applySoundOrder}
          />
        ) : undefined
      }
    >
      <div className="mb-3 flex flex-col gap-3">
        {nowPlayingItem?.sound && (
          <NowPlayingBar title={nowPlayingItem.sound.title} />
        )}
      </div>

      {items.length === 0 ? (
        <PageEmpty
          title={t('tracklistPanelFields.noTracksYet')}
          description={
            editing ? 'Add sound items below.' : 'Click Edit to add tracks.'
          }
          action={
            onAddTracks ? (
              <Button size="sm" variant="secondary" onClick={onAddTracks}>
                <ListPlusIcon size={16} aria-hidden />
                {t('emptyActions.addTracks')}
              </Button>
            ) : undefined
          }
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
    </StudioPanel>
  );
}
