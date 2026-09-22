import {
  CopyIcon,
  DownloadIcon,
  ListMusicIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  ShuffleIcon,
  TrashIcon,
  UploadIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, EmptyState, Tooltip } from '@tahti-player/ui';

import type {
  NativeImportPreview,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { ConfirmDialog } from '../ConfirmDialog';
import { PlaylistExportDialog } from '../PlaylistExportDialog';
import { PlaylistImportDialog } from '../PlaylistImportDialog';
import { PlaylistNameDialog } from '../PlaylistNameDialog';
import { SmartPlaylists } from '../SmartPlaylists';
import { playPlaylist, summaryLine } from './shared';

type BrowserProps = {
  library: TahtiNativeLibrary;
  onOpen: (id: string) => void;
};

export function PlaylistsBrowser({ library, onOpen }: BrowserProps) {
  const [playlists, setPlaylists] = useState<NativePlaylistSummary[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<NativePlaylistSummary | null>(null);
  const [deleting, setDeleting] = useState<NativePlaylistSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<NativePlaylistSummary | null>(
    null,
  );
  const [importPreview, setImportPreview] =
    useState<NativeImportPreview | null>(null);
  const [choosing, setChoosing] = useState(false);

  const startImport = async () => {
    setChoosing(true);
    try {
      setImportPreview(await library.playlists.importPreview());
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not read that file.',
      );
    } finally {
      setChoosing(false);
    }
  };

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
        <Button
          size="sm"
          variant="text"
          disabled={choosing}
          onClick={() => void startImport()}
        >
          {choosing ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : (
            <UploadIcon size={14} aria-hidden />
          )}
          Import…
        </Button>
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
                  <Tooltip content="Export as M3U8" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Export ${playlist.name}`}
                      onClick={() => setExporting(playlist)}
                    >
                      <DownloadIcon size={14} aria-hidden />
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
      <PlaylistExportDialog
        playlist={exporting}
        library={library}
        onClose={() => setExporting(null)}
      />
      <PlaylistImportDialog
        initial={importPreview}
        library={library}
        onClose={() => setImportPreview(null)}
        onImported={(playlist) => {
          void load();
          onOpen(playlist.id);
        }}
      />
      <SmartPlaylists library={library} onPlaylistCreated={() => void load()} />
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
