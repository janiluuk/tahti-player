import {
  ArrowLeftIcon,
  CopyIcon,
  ListMusicIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  ShuffleIcon,
  TrashIcon,
  Undo2Icon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { toast } from 'sonner';

import {
  Button,
  CatalogTable,
  EmptyState,
  Tooltip,
  type CatalogColumn,
} from '@tahti-player/ui';

import { usePersistedCatalogTable } from '../hooks/usePersistedCatalogTable';
import { formatTotalDuration, pluralTracks } from '../lib/libraryFormat';
import type {
  NativePlaylistEntry,
  NativePlaylistSummary,
  NativeRawPlaylistEntry,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { preparePlayables, shuffled } from '../lib/nativePlayback';
import { formatDuration } from '../lib/playableToTrack';
import { usePlayerStore } from '../stores/playerStore';
import { ConfirmDialog } from './ConfirmDialog';
import { PlaylistNameDialog } from './PlaylistNameDialog';

const MAX_UNDO = 20;

export const PLAYLIST_COLUMNS: CatalogColumn<NativePlaylistEntry>[] = [
  {
    id: 'position',
    header: '#',
    width: 56,
    align: 'right',
    render: (entry) => entry.position + 1,
  },
  {
    id: 'title',
    header: 'Title',
    width: 280,
    required: true,
    render: (entry) => (
      <span title={entry.path}>
        {entry.title}
        {entry.unavailable ? (
          <span
            className="text-destructive ml-2 text-xs"
            title={
              entry.track
                ? 'The original file is missing'
                : 'This track is no longer in your library'
            }
          >
            Unavailable
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: 'artist',
    header: 'Artist',
    width: 200,
    render: (entry) => entry.artist || 'Unknown artist',
  },
  {
    id: 'album',
    header: 'Album',
    width: 180,
    hiddenByDefault: true,
    render: (entry) => entry.track?.album || '—',
  },
  {
    id: 'duration',
    header: 'Time',
    width: 80,
    align: 'right',
    render: (entry) => (entry.duration ? formatDuration(entry.duration) : '—'),
  },
];

function summaryLine(playlist: NativePlaylistSummary) {
  const parts = [
    pluralTracks(playlist.trackCount),
    formatTotalDuration(playlist.durationSec),
  ];
  if (playlist.unavailableCount) {
    parts.push(`${playlist.unavailableCount} unavailable`);
  }
  return parts.join(' · ');
}

/** Turns a playlist's linked tracks into a queue and starts it. */
async function playPlaylist(
  library: TahtiNativeLibrary,
  id: string,
  options: { shuffle?: boolean; startAtLinked?: number } = {},
) {
  const trackIds = await library.playlists.trackIds(id);
  if (trackIds.length === 0) {
    toast.error('None of this playlist’s tracks can be played.');
    return;
  }
  const ordered = options.shuffle ? shuffled(trackIds) : trackIds;
  const playables = await preparePlayables(library, ordered, 'playlist');
  const start = options.startAtLinked ?? 0;
  const [head, ...rest] = options.shuffle
    ? playables
    : [...playables.slice(start), ...playables.slice(0, start)];
  if (!head) {
    toast.error('None of this playlist’s tracks can be played.');
    return;
  }
  usePlayerStore.getState().play(head, { enqueueRest: rest });
}

type BrowserProps = {
  library: TahtiNativeLibrary;
  onOpen: (id: string) => void;
};

function PlaylistsBrowser({ library, onOpen }: BrowserProps) {
  const [playlists, setPlaylists] = useState<NativePlaylistSummary[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<NativePlaylistSummary | null>(null);
  const [deleting, setDeleting] = useState<NativePlaylistSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPlaylists(await library.playlists.list());
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not load playlists.',
      );
    }
  }, [library]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (
    id: string,
    action: () => Promise<void>,
    failure: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : failure);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="text-foreground-secondary flex-1 text-xs">
          Local playlists live on this device and work offline. They are
          separate from your Tahti cloud collections.
        </p>
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
          <PlusIcon size={14} aria-hidden />
          New playlist
        </Button>
      </div>
      {error ? (
        <EmptyState
          size="sm"
          title="Playlists unavailable"
          description={error}
          action={
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          }
          className="flex-1"
        />
      ) : playlists === null ? (
        <EmptyState size="sm" title="Loading…" className="flex-1" />
      ) : playlists.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<ListMusicIcon size={28} className="opacity-50" />}
          title="No playlists yet"
          description="Create one here, or select tracks in Tracks and choose Add to playlist."
          action={
            <Button variant="secondary" onClick={() => setCreating(true)}>
              New playlist
            </Button>
          }
          className="flex-1"
        />
      ) : (
        <ul
          className="tahti-hide-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          aria-label="Playlists"
        >
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className="border-border flex items-center gap-1 rounded-md border pr-1"
            >
              <Button
                variant="text"
                className="h-auto min-w-0 flex-1 justify-start px-2 py-1.5 text-left"
                onClick={() => onOpen(playlist.id)}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {playlist.name}
                  </span>
                  <span className="text-foreground-secondary truncate text-xs font-normal">
                    {summaryLine(playlist)}
                  </span>
                </span>
              </Button>
              {busyId === playlist.id ? (
                <LoaderCircleIcon
                  size={14}
                  className="mx-2 animate-spin"
                  aria-label="Working"
                />
              ) : (
                <>
                  <Tooltip content="Play" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Play ${playlist.name}`}
                      disabled={playlist.trackCount === 0}
                      onClick={() =>
                        void run(
                          playlist.id,
                          () => playPlaylist(library, playlist.id),
                          'Could not play playlist.',
                        )
                      }
                    >
                      <PlayIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Shuffle" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Shuffle ${playlist.name}`}
                      disabled={playlist.trackCount === 0}
                      onClick={() =>
                        void run(
                          playlist.id,
                          () =>
                            playPlaylist(library, playlist.id, {
                              shuffle: true,
                            }),
                          'Could not play playlist.',
                        )
                      }
                    >
                      <ShuffleIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Duplicate" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Duplicate ${playlist.name}`}
                      onClick={() =>
                        void run(
                          playlist.id,
                          async () => {
                            const copy = await library.playlists.duplicate(
                              playlist.id,
                            );
                            toast.success(`Created “${copy.name}”.`);
                          },
                          'Could not duplicate playlist.',
                        )
                      }
                    >
                      <CopyIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Rename" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Rename ${playlist.name}`}
                      onClick={() => setRenaming(playlist)}
                    >
                      <PencilIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Delete" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      intent="danger"
                      aria-label={`Delete ${playlist.name}`}
                      onClick={() => setDeleting(playlist)}
                    >
                      <TrashIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <PlaylistNameDialog
        isOpen={creating}
        title="New playlist"
        confirmLabel="Create"
        onClose={() => setCreating(false)}
        onSubmit={async (name) => {
          const created = await library.playlists.create(name);
          toast.success(`Created “${created.name}”.`);
          await load();
        }}
      />
      <PlaylistNameDialog
        isOpen={renaming !== null}
        title="Rename playlist"
        confirmLabel="Rename"
        initialName={renaming?.name}
        onClose={() => setRenaming(null)}
        onSubmit={async (name) => {
          if (!renaming) {
            return;
          }
          await library.playlists.rename(renaming.id, name);
          toast.success(`Renamed to “${name}”.`);
          await load();
        }}
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete this playlist?"
        description={`“${deleting?.name ?? ''}” and its ${deleting?.trackCount ?? 0} entries will be deleted. The tracks stay in your library.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) {
            void run(
              target.id,
              async () => {
                await library.playlists.delete(target.id);
                toast.success(`Deleted “${target.name}”.`);
              },
              'Could not delete playlist.',
            );
          }
        }}
      />
    </div>
  );
}

type UndoStep = { label: string; run: () => Promise<void> };

type ViewProps = {
  library: TahtiNativeLibrary;
  id: string;
  onBack: () => void;
};

/** One playlist: entries in order, reorder, multi-remove with undo, play/shuffle. */
function PlaylistView({ library, id, onBack }: ViewProps) {
  const table = usePersistedCatalogTable(
    'tahti-local-playlist-table',
    PLAYLIST_COLUMNS,
  );
  const [summary, setSummary] = useState<NativePlaylistSummary | null>(null);
  const [entries, setEntries] = useState<NativePlaylistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [undoDepth, setUndoDepth] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const undoStack = useRef<UndoStep[]>([]);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    try {
      const [list, page] = await Promise.all([
        library.playlists.list(),
        library.playlists.entries(id, 0),
      ]);
      if (request !== requestRef.current) {
        return;
      }
      const current = list.find((playlist) => playlist.id === id) ?? null;
      if (!current) {
        setError('This playlist no longer exists.');
        return;
      }
      setSummary(current);
      setEntries(page.entries);
      setTotal(page.total);
      setError(null);
    } catch (failure) {
      if (request === requestRef.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not load playlist.',
        );
      }
    } finally {
      if (request === requestRef.current) {
        setLoading(false);
      }
    }
  }, [library, id]);

  useEffect(() => {
    undoStack.current = [];
    setUndoDepth(0);
    setSelectedIds(new Set());
    void load();
  }, [load]);

  const loadMore = async () => {
    if (loading || entries.length >= total) {
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    try {
      const page = await library.playlists.entries(id, entries.length);
      if (request !== requestRef.current) {
        return;
      }
      setEntries((current) => [...current, ...page.entries]);
      setTotal(page.entries.length === 0 ? entries.length : page.total);
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not load more.',
      );
    } finally {
      if (request === requestRef.current) {
        setLoading(false);
      }
    }
  };

  const pushUndo = (step: UndoStep) => {
    undoStack.current = [...undoStack.current, step].slice(-MAX_UNDO);
    setUndoDepth(undoStack.current.length);
  };

  const undo = async () => {
    const step = undoStack.current.at(-1);
    if (!step || busy) {
      return;
    }
    undoStack.current = undoStack.current.slice(0, -1);
    setUndoDepth(undoStack.current.length);
    setBusy(true);
    try {
      await step.run();
      toast.success(`Undid: ${step.label}.`);
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not undo.',
      );
    } finally {
      setBusy(false);
    }
  };

  const withUndoToast = (label: string) =>
    toast.success(label, {
      action: { label: 'Undo', onClick: () => void undo() },
    });

  const moveRows = async (rowIds: string[], toIndex: number) => {
    setBusy(true);
    try {
      const before = await library.playlists.entryIds(id);
      await library.playlists.moveEntries(id, rowIds, toIndex);
      pushUndo({
        label:
          rowIds.length === 1 ? 'move' : `move of ${rowIds.length} entries`,
        run: () => library.playlists.setOrder(id, before),
      });
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not move.',
      );
    } finally {
      setBusy(false);
    }
  };

  const removeRows = async (rowIds: string[]) => {
    setBusy(true);
    try {
      const before = await library.playlists.entryIds(id);
      const removed: NativeRawPlaylistEntry[] =
        await library.playlists.removeEntries(id, rowIds);
      pushUndo({
        label:
          removed.length === 1
            ? 'removal'
            : `removal of ${removed.length} entries`,
        run: () => library.playlists.restoreEntries(id, removed, before),
      });
      setSelectedIds(new Set());
      withUndoToast(
        removed.length === 1
          ? 'Removed 1 entry from the playlist.'
          : `Removed ${removed.length} entries from the playlist.`,
      );
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not remove.',
      );
    } finally {
      setBusy(false);
    }
  };

  const play = async (options: {
    shuffle?: boolean;
    fromEntryIndex?: number;
  }) => {
    setBusy(true);
    try {
      const linkedBefore =
        options.fromEntryIndex === undefined
          ? 0
          : entries
              .slice(0, options.fromEntryIndex)
              .filter((entry) => entry.track).length;
      await playPlaylist(library, id, {
        shuffle: options.shuffle,
        startAtLinked: linkedBefore,
      });
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not play.',
      );
    } finally {
      setBusy(false);
    }
  };

  const queueSelected = async () => {
    const wanted = entries
      .filter((entry) => selectedIds.has(entry.entryId) && entry.track)
      .map((entry) => (entry.track as NonNullable<typeof entry.track>).id);
    if (!wanted.length) {
      toast.error('None of the selected entries can be played.');
      return;
    }
    const playables = await preparePlayables(library, wanted, 'selected');
    usePlayerStore.getState().enqueueMany(playables);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'z'
    ) {
      event.preventDefault();
      void undo();
    } else if (event.key === 'Delete' && selectedIds.size > 0) {
      event.preventDefault();
      void removeRows([...selectedIds]);
    }
  };

  const columns = useMemo(() => PLAYLIST_COLUMNS, []);

  if (error && !summary) {
    return (
      <EmptyState
        size="sm"
        title="Playlist unavailable"
        description={error}
        action={
          <Button variant="secondary" onClick={onBack}>
            Back to playlists
          </Button>
        }
        className="flex-1"
      />
    );
  }

  return (
    // The wrapper only forwards shortcuts from the focused table inside it.
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      onKeyDown={onKeyDown}
      data-testid="playlist-view"
    >
      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="text" onClick={onBack}>
          <ArrowLeftIcon size={14} aria-hidden />
          Playlists
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{summary?.name}</p>
          <p className="text-foreground-secondary truncate text-xs">
            {summary ? summaryLine(summary) : 'Loading…'}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || !summary?.trackCount}
          onClick={() => void play({})}
        >
          <PlayIcon size={14} aria-hidden />
          Play
        </Button>
        <Button
          size="sm"
          variant="text"
          disabled={busy || !summary?.trackCount}
          onClick={() => void play({ shuffle: true })}
        >
          <ShuffleIcon size={14} aria-hidden />
          Shuffle
        </Button>
        <Tooltip content="Undo (Ctrl+Z)" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label="Undo"
            disabled={busy || undoDepth === 0}
            onClick={() => void undo()}
          >
            <Undo2Icon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Rename" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label="Rename playlist"
            onClick={() => setRenaming(true)}
          >
            <PencilIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Delete playlist" side="top">
          <Button
            size="icon-sm"
            variant="text"
            intent="danger"
            aria-label="Delete playlist"
            onClick={() => setDeleting(true)}
          >
            <TrashIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {entries.length === 0 && !loading ? (
        <EmptyState
          size="sm"
          icon={<ListMusicIcon size={28} className="opacity-50" />}
          title="This playlist is empty"
          description="Select tracks in Tracks and choose Add to playlist, or save your queue here."
          className="flex-1"
        />
      ) : (
        <CatalogTable
          columns={columns}
          view={table.view}
          onViewChange={table.setView}
          layouts={table.layouts}
          rows={entries}
          total={total}
          itemNoun="entries"
          getRowId={(entry) => entry.entryId}
          getRowLabel={(entry) => entry.title}
          sort={null}
          onSortChange={() => undefined}
          onLoadMore={() => void loadMore()}
          loading={loading || busy}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          isRowMuted={(entry) => entry.unavailable}
          onMoveRows={(rowIds, toIndex) => void moveRows(rowIds, toIndex)}
          onActivateRow={(entry) => {
            if (!entry.unavailable) {
              void play({ fromEntryIndex: entries.indexOf(entry) });
            }
          }}
          toolbar={
            selectedIds.size ? (
              <>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => void queueSelected()}
                >
                  Add to queue
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  intent="danger"
                  disabled={busy}
                  onClick={() => void removeRows([...selectedIds])}
                >
                  <TrashIcon size={14} aria-hidden />
                  Remove
                </Button>
              </>
            ) : null
          }
          renderActions={(entry) => (
            <>
              <Tooltip content="Play from here" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Play ${entry.title} from here`}
                  disabled={entry.unavailable}
                  onClick={() =>
                    void play({ fromEntryIndex: entries.indexOf(entry) })
                  }
                >
                  <PlayIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content="Remove from playlist" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  intent="danger"
                  aria-label={`Remove ${entry.title} from playlist`}
                  onClick={() => void removeRows([entry.entryId])}
                >
                  <TrashIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
            </>
          )}
        />
      )}
      <PlaylistNameDialog
        isOpen={renaming}
        title="Rename playlist"
        confirmLabel="Rename"
        initialName={summary?.name}
        onClose={() => setRenaming(false)}
        onSubmit={async (name) => {
          await library.playlists.rename(id, name);
          toast.success(`Renamed to “${name}”.`);
          await load();
        }}
      />
      <ConfirmDialog
        isOpen={deleting}
        title="Delete this playlist?"
        description={`“${summary?.name ?? ''}” and its ${summary?.trackCount ?? 0} entries will be deleted. The tracks stay in your library.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false);
          void library.playlists
            .delete(id)
            .then(() => {
              toast.success(`Deleted “${summary?.name ?? 'playlist'}”.`);
              onBack();
            })
            .catch((failure: unknown) =>
              toast.error(
                failure instanceof Error
                  ? failure.message
                  : 'Could not delete playlist.',
              ),
            );
        }}
      />
    </div>
  );
}

type Props = {
  library: TahtiNativeLibrary;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
};

/** The Playlists tab of Local files: list of playlists, or one opened. */
export function LocalPlaylists({ library, openId, onOpenChange }: Props) {
  return openId ? (
    <PlaylistView
      library={library}
      id={openId}
      onBack={() => onOpenChange(null)}
    />
  ) : (
    <PlaylistsBrowser library={library} onOpen={onOpenChange} />
  );
}
