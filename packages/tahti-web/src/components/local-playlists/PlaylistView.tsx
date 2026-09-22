import {
  ArrowLeftIcon,
  DownloadIcon,
  LinkIcon,
  ListMusicIcon,
  PencilIcon,
  PlayIcon,
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

import { Button, CatalogTable, EmptyState, Tooltip } from '@tahti-player/ui';

import { usePersistedCatalogTable } from '../../hooks/usePersistedCatalogTable';
import type {
  NativePlaylistEntry,
  NativePlaylistSummary,
  NativeRawPlaylistEntry,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { preparePlayables } from '../../lib/nativePlayback';
import { usePlayerStore } from '../../stores/playerStore';
import { ConfirmDialog } from '../ConfirmDialog';
import { PlaylistExportDialog } from '../PlaylistExportDialog';
import { PlaylistNameDialog } from '../PlaylistNameDialog';
import { PLAYLIST_COLUMNS, playPlaylist, summaryLine } from './shared';

const MAX_UNDO = 20;

type UndoStep = { label: string; run: () => Promise<void> };

type ViewProps = {
  library: TahtiNativeLibrary;
  id: string;
  onBack: () => void;
};

/** One playlist: entries in order, reorder, multi-remove with undo, play/shuffle. */
export function PlaylistView({ library, id, onBack }: ViewProps) {
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
  const [exporting, setExporting] = useState(false);
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

  const locateEntry = async (entry: NativePlaylistEntry) => {
    setBusy(true);
    try {
      if (await library.playlists.relinkEntry(id, entry.entryId)) {
        toast.success(`Linked “${entry.title}” to the file you chose.`);
        await load();
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not link the file.',
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
        <Tooltip content="Export as M3U8" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label="Export playlist"
            onClick={() => setExporting(true)}
          >
            <DownloadIcon size={14} aria-hidden />
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
              {entry.unavailable ? (
                <Tooltip content="Locate the file" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Locate ${entry.title}`}
                    onClick={() => void locateEntry(entry)}
                  >
                    <LinkIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              ) : null}
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
      <PlaylistExportDialog
        playlist={exporting ? summary : null}
        library={library}
        onClose={() => setExporting(false)}
      />
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
