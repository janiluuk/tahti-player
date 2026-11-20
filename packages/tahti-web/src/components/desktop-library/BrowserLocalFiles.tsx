import { TrashIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, FilePicker, FilterBar, Tooltip } from '@tahti-player/ui';

import type { TahtiPlayable } from '../../api/types';
import {
  filterLocalLibraryTracks,
  isLocalTrackPlayable,
  playableFromLocalTrack,
  useLocalLibraryStore,
} from '../../stores/localLibraryStore';
import { PageEmpty } from '../PageStates';
import { PlayableAmbientTrackList } from '../PlayableAmbientTrackList';

/** Browser-only library: files are kept in memory, no desktop catalog. */
export function BrowserLocalFiles() {
  const { t } = useTranslation('web');
  const [query, setQuery] = useState('');
  const tracks = useLocalLibraryStore((s) => s.tracks);
  const addFiles = useLocalLibraryStore((s) => s.addFiles);
  const remove = useLocalLibraryStore((s) => s.remove);
  const filteredTracks = useMemo(
    () => filterLocalLibraryTracks(tracks, query),
    [query, tracks],
  );
  const unresolvedTracks = useMemo(
    () => filteredTracks.filter((track) => !isLocalTrackPlayable(track)),
    [filteredTracks],
  );
  const playableLocalTracks = useMemo(
    () => filteredTracks.filter((track) => isLocalTrackPlayable(track)),
    [filteredTracks],
  );
  const playableItems = useMemo(
    () =>
      playableLocalTracks
        .map(playableFromLocalTrack)
        .filter((item): item is TahtiPlayable => item !== null),
    [playableLocalTracks],
  );
  const playableById = useMemo(
    () =>
      new Map(playableLocalTracks.map((track) => [`local:${track.id}`, track])),
    [playableLocalTracks],
  );

  const onFiles = (files: readonly File[]) => {
    const added = addFiles(files);
    if (added.length === 0) {
      toast.error(i18n.t('web:toasts.chooseAudioFile'));
      return;
    }
    toast.success(
      added.length === 1
        ? i18n.t('web:browserLocalFilesBatch31.readyNamed', {
            name: added[0]?.title ?? '',
          })
        : i18n.t('web:browserLocalFilesBatch31.readyFiles', {
            count: added.length,
          }),
    );
  };

  return (
    <>
      <FilePicker
        accept="audio/*"
        multiple
        labels={{
          title: t('browserLocalFilesBatch31.addAudioFiles'),
          description: t('browserLocalFilesBatch31.addAudioFilesHint'),
          browse: t('browserLocalFilesBatch31.chooseFiles'),
        }}
        onFiles={onFiles}
      />
      <p className="border-border bg-background-secondary text-foreground-secondary rounded-md border px-2 py-1.5 text-xs">
        {t('browserLocalFiles.tahtiPlayerDesktopRuntimeDetected')}
      </p>
      {tracks.length === 0 ? (
        <PageEmpty
          title={t('empties.localLibrary')}
          description={t('empties.importFilesToPlayThemIn')}
          className="flex-1"
        />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PlayableAmbientTrackList
              items={playableItems}
              emptyMessage={
                query.trim()
                  ? t('browserLocalFilesBatch31.noMatch', {
                      query: query.trim(),
                    })
                  : t('browserLocalFilesBatch31.noPlayable')
              }
              toolbarStart={
                <FilterBar
                  searchValue={query}
                  onSearchChange={setQuery}
                  searchLabel={t('browserLocalFiles.searchLocalFiles')}
                  searchPlaceholder={t(
                    'browserLocalFiles.titleArtistOrFileName',
                  )}
                />
              }
              selectable
              onRemove={(item) => {
                const track = playableById.get(item.id);
                if (!track) {
                  return;
                }
                remove(track.id);
                toast.success(
                  i18n.t('web:toasts.removedNamedQuotes', { name: item.title }),
                );
              }}
              onBulkRemove={(items) => {
                for (const item of items) {
                  const track = playableById.get(item.id);
                  if (track) {
                    remove(track.id);
                  }
                }
                toast.success(
                  i18n.t('web:browserLocalFilesBatch31.removedTracks', {
                    count: items.length,
                  }),
                );
              }}
              compactActions
            />
          </div>
          {unresolvedTracks.length > 0 ? (
            <ul className="tahti-hide-scrollbar flex max-h-32 flex-col gap-1 overflow-y-auto">
              {unresolvedTracks.map((track) => (
                <li
                  key={track.id}
                  className="border-border flex items-center gap-2 rounded-md border px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {track.title}
                    </p>
                    <p className="text-foreground-secondary truncate text-xs">
                      {t('browserLocalFilesBatch31.reimportToPlay', {
                        fileName: track.fileName,
                      })}
                    </p>
                  </div>
                  <Tooltip content={t('browserLocalFiles.remove')} side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      intent="danger"
                      aria-label={t('browserLocalFilesLabels.removeTitle', {
                        title: track.title,
                      })}
                      onClick={() => {
                        remove(track.id);
                        toast.success(
                          i18n.t('web:toasts.removedNamedQuotes', {
                            name: track.title,
                          }),
                        );
                      }}
                    >
                      <TrashIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </>
  );
}
