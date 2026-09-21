import { ListPlusIcon, LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input } from '@tahti-player/ui';

import { formatTotalDuration, pluralTracks } from '../lib/libraryFormat';
import type {
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  /** Called when the user picks a playlist, so large sets are only fetched on demand. */
  resolveTrackIds: () => Promise<string[]>;
  /** Shown in the description, e.g. "12 selected tracks". */
  summary: string;
  onAdded?: (playlist: NativePlaylistSummary, added: number) => void;
};

/** Picks (or creates) a local playlist and appends tracks to it, repeats allowed. */
export function AddToPlaylistDialog({
  isOpen,
  onClose,
  library,
  resolveTrackIds,
  summary,
  onAdded,
}: Props) {
  const [playlists, setPlaylists] = useState<NativePlaylistSummary[] | null>(
    null,
  );
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | 'new' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let stale = false;
    setPlaylists(null);
    library.playlists
      .list()
      .then((list) => {
        if (!stale) {
          setPlaylists(list);
        }
      })
      .catch((error: unknown) => {
        if (!stale) {
          setPlaylists([]);
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not load playlists.',
          );
        }
      });
    return () => {
      stale = true;
    };
  }, [isOpen, library]);

  const addTo = async (
    key: string,
    target: () => Promise<NativePlaylistSummary>,
  ) => {
    setBusy(key);
    try {
      const ids = await resolveTrackIds();
      const playlist = await target();
      const added = await library.playlists.addTracks(playlist.id, ids);
      toast.success(
        added === 1
          ? `Added 1 track to “${playlist.name}”.`
          : `Added ${added.toLocaleString('en-US')} tracks to “${playlist.name}”.`,
        added < ids.length
          ? {
              description: `${ids.length - added} could not be added because they are no longer in the library.`,
            }
          : undefined,
      );
      onAdded?.(playlist, added);
      setName('');
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not add to playlist.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={() => (busy ? undefined : onClose())}>
      <Dialog.Title>Add to playlist</Dialog.Title>
      <Dialog.Description>
        {summary}. Tracks are added to the end; the same track can appear more
        than once.
      </Dialog.Description>
      <div className="flex max-h-[45vh] flex-col gap-1 overflow-y-auto py-2">
        {playlists === null ? (
          <p className="text-foreground-secondary text-sm">Loading…</p>
        ) : playlists.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            No playlists yet — create one below.
          </p>
        ) : (
          playlists.map((playlist) => (
            <Button
              key={playlist.id}
              variant="text"
              className="border-border h-auto w-full justify-start rounded-md border px-2 py-1.5 text-left"
              disabled={busy !== null}
              onClick={() =>
                void addTo(playlist.id, () => Promise.resolve(playlist))
              }
            >
              {busy === playlist.id ? (
                <LoaderCircleIcon
                  size={14}
                  className="animate-spin"
                  aria-hidden
                />
              ) : (
                <ListPlusIcon size={14} aria-hidden />
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {playlist.name}
                </span>
                <span className="text-foreground-secondary text-xs font-normal">
                  {pluralTracks(playlist.trackCount)} ·{' '}
                  {formatTotalDuration(playlist.durationSec)}
                </span>
              </span>
            </Button>
          ))
        )}
      </div>
      <div className="border-border flex items-end gap-2 border-t pt-3">
        <Input
          label="New playlist"
          placeholder="Playlist name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="flex-1"
        />
        <Button
          variant="secondary"
          disabled={!name.trim() || busy !== null}
          onClick={() =>
            void addTo('new', () => library.playlists.create(name.trim()))
          }
        >
          {busy === 'new' ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Create and add
        </Button>
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
