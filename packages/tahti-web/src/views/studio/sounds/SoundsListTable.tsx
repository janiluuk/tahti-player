import { useMemo } from 'react';

import {
  Badge,
  CatalogTable,
  MediaArtwork,
  TrackProcessing,
  type CatalogColumn,
  type CatalogSort,
} from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { StudioSoundRowMenu } from '../../../components/StudioSoundRowMenu';
import { usePersistedCatalogTable } from '../../../hooks/usePersistedCatalogTable';
import { EMBED_PROVIDER_LABEL, embedSrcFor } from '../../../lib/embedSrc';
import { formatDuration } from '../../../lib/playableToTrack';
import { usePlayerStore } from '../../../stores/playerStore';
import { formatUploadDate, SoundTitle } from './SoundsAmbientList';
import type { StudioSoundsState } from './useStudioSoundsState';

const dash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

function isProcessingSound(sound: StudioSound): boolean {
  return (
    !sound.embedProvider &&
    (sound.status === 'PENDING' || sound.status === 'PROCESSING')
  );
}

function visibilityLabel(sound: StudioSound): string {
  if (sound.visibility === 'UNLISTED') {
    return 'Unlisted';
  }
  if (sound.visibility === 'STASH') {
    return 'Stash';
  }
  if (sound.visibility === 'PRIVATE') {
    return 'Private';
  }
  return sound.isPublic === false ? 'Private' : 'Public';
}

function statusCell(sound: StudioSound) {
  if (isProcessingSound(sound)) {
    return <TrackProcessing />;
  }
  if (sound.status === 'ERROR') {
    return (
      <Badge variant="pill" color="red">
        Failed
      </Badge>
    );
  }
  return <span className="text-foreground-secondary text-xs">Ready</span>;
}

const SORT_VALUE: Record<string, (sound: StudioSound) => string | number> = {
  title: (sound) => sound.title.toLowerCase(),
  status: (sound) => sound.status,
  duration: (sound) => sound.durationSec ?? -1,
  genre: (sound) => (sound.genre ?? '').toLowerCase(),
  uploaded: (sound) => sound.createdAt ?? '',
  visibility: (sound) => visibilityLabel(sound),
};

function sortSounds(
  sounds: StudioSound[],
  sort: CatalogSort | null,
): StudioSound[] {
  const value = sort ? SORT_VALUE[sort.columnId] : undefined;
  if (!sort || !value) {
    return sounds;
  }
  const direction = sort.descending ? -1 : 1;
  return [...sounds].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    return left < right ? -direction : left > right ? direction : 0;
  });
}

const soundRowId = (sound: StudioSound) => sound.id;
const soundRowLabel = (sound: StudioSound) => sound.title;

/** Library → Sounds as a plain data table: a mini cover that previews the
 * track, then one column per field. Columns, widths and sort are kept on
 * this device. */
export function SoundsListTable({
  items,
  state,
}: {
  items: StudioSound[];
  state: StudioSoundsState;
}) {
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const {
    playItem,
    playEmbedItem,
    busyId,
    togglePin,
    setPendingDeleteItem,
    selectedIds,
    setSelectedIds,
  } = state;

  const columns = useMemo<CatalogColumn<StudioSound>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        width: 320,
        sortable: true,
        required: true,
        render: (sound) => {
          const embedSrc =
            sound.embedProvider && sound.embedUri
              ? embedSrcFor(sound.embedProvider, sound.embedUri)
              : null;
          const isCurrent = currentId === `sound:${sound.id}`;
          const isPlaying =
            isCurrent && (status === 'playing' || status === 'loading');
          return (
            <span className="flex min-w-0 items-center gap-2">
              <MediaArtwork
                src={sound.bannerUrl ?? undefined}
                alt=""
                size="sm"
                className="size-8 min-w-8 rounded-sm"
                isPlaying={isPlaying && status !== 'loading'}
                isLoading={isCurrent && status === 'loading'}
                playDisabled={isProcessingSound(sound)}
                playLabel={`Preview ${sound.title}`}
                pauseLabel={`Pause ${sound.title}`}
                onPlay={() =>
                  embedSrc
                    ? playEmbedItem(sound)
                    : void playItem(sound.id, sound.title)
                }
              />
              <span className="min-w-0 truncate">
                <SoundTitle item={sound} />
              </span>
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        width: 120,
        sortable: true,
        render: statusCell,
      },
      {
        id: 'duration',
        header: 'Length',
        width: 90,
        sortable: true,
        align: 'right',
        render: (sound) =>
          sound.durationSec != null ? formatDuration(sound.durationSec) : '—',
      },
      {
        id: 'genre',
        header: 'Genre',
        width: 140,
        sortable: true,
        render: (sound) => dash(sound.genre),
      },
      {
        id: 'uploaded',
        header: 'Uploaded',
        width: 130,
        sortable: true,
        render: (sound) => dash(formatUploadDate(sound.createdAt)),
      },
      {
        id: 'visibility',
        header: 'Visibility',
        width: 110,
        sortable: true,
        render: visibilityLabel,
      },
      {
        id: 'downloads',
        header: 'Downloads',
        width: 110,
        render: (sound) => (sound.downloadsEnabled === false ? 'Off' : 'On'),
      },
      {
        id: 'access',
        header: 'Access',
        width: 130,
        hiddenByDefault: true,
        render: (sound) =>
          sound.accessMode === 'SUBSCRIBERS_ONLY'
            ? 'Subscribers'
            : sound.accessMode === 'PURCHASE'
              ? 'For sale'
              : 'Free',
      },
      {
        id: 'source',
        header: 'Source',
        width: 120,
        hiddenByDefault: true,
        render: (sound) =>
          sound.embedProvider
            ? (EMBED_PROVIDER_LABEL[sound.embedProvider] ?? sound.embedProvider)
            : 'Upload',
      },
    ],
    [currentId, status, playItem, playEmbedItem],
  );

  const table = usePersistedCatalogTable('tahti.librarySounds.table', columns);
  const rows = useMemo(
    () => sortSounds(items, table.sort),
    [items, table.sort],
  );

  return (
    <CatalogTable
      columns={columns}
      view={table.view}
      onViewChange={table.setView}
      rows={rows}
      total={rows.length}
      itemNoun="sounds"
      getRowId={soundRowId}
      getRowLabel={soundRowLabel}
      sort={table.sort}
      onSortChange={table.setSort}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      layouts={table.layouts}
      renderActions={(sound) => (
        <StudioSoundRowMenu
          item={sound}
          busy={busyId === sound.id}
          hasEmbed={Boolean(sound.embedProvider && sound.embedUri)}
          onTogglePin={() => void togglePin(sound)}
          onDelete={() => setPendingDeleteItem(sound)}
        />
      )}
    />
  );
}
