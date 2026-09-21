import {
  CopyIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  ShuffleIcon,
  SparklesIcon,
  TrashIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Tooltip } from '@tahti-player/ui';

import type {
  NativeSmartDefinition,
  NativeSmartPlaylist,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { preparePlayables, shuffled } from '../lib/nativePlayback';
import { usePlayerStore } from '../stores/playerStore';
import { ConfirmDialog } from './ConfirmDialog';
import { PlaylistNameDialog } from './PlaylistNameDialog';
import { SmartPlaylistDialog } from './SmartPlaylistDialog';
import { describeRules, EMPTY_SMART } from './smartPlaylistRules';

type Props = {
  library: TahtiNativeLibrary;
  /** Called after a snapshot created an ordinary playlist. */
  onPlaylistCreated: () => void;
};

function definitionOf(list: NativeSmartPlaylist): NativeSmartDefinition {
  return {
    name: list.name,
    matchAll: list.matchAll,
    rules: list.rules,
    sort: list.sort,
    descending: list.descending,
    limit: list.limit,
  };
}

async function playSmart(
  library: TahtiNativeLibrary,
  id: string,
  shuffle: boolean,
) {
  const ids = await library.analysis.smart.trackIds(id);
  if (ids.length === 0) {
    toast.error('No tracks match this smart playlist right now.');
    return;
  }
  const playables = await preparePlayables(
    library,
    shuffle ? shuffled(ids) : ids,
    'playlist',
  );
  const [head, ...rest] = playables;
  if (!head) {
    toast.error('None of the matching tracks can be played.');
    return;
  }
  usePlayerStore.getState().play(head, { enqueueRest: rest });
}

/** Smart playlists: saved rule sets that are re-evaluated on every use. */
export function SmartPlaylists({ library, onPlaylistCreated }: Props) {
  const [lists, setLists] = useState<NativeSmartPlaylist[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<{
    id: string | null;
    definition: NativeSmartDefinition;
  } | null>(null);
  const [deleting, setDeleting] = useState<NativeSmartPlaylist | null>(null);
  const [snapshotOf, setSnapshotOf] = useState<NativeSmartPlaylist | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await library.analysis.smart.list();
      setLists(next);
      // Live counts: each list is evaluated now, not remembered.
      const entries = await Promise.all(
        next.map(async (list) => {
          try {
            const page = await library.analysis.smart.evaluate(
              list.id,
              null,
              0,
            );
            return [list.id, page.total] as const;
          } catch {
            return [list.id, -1] as const;
          }
        }),
      );
      setCounts(Object.fromEntries(entries));
    } catch (failure) {
      setLists([]);
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not load smart playlists.',
      );
    }
  }, [library]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (
    id: string,
    action: () => Promise<void>,
    fallback: string,
  ) => {
    setBusyId(id);
    try {
      await action();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : fallback);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="flex flex-col gap-1" aria-label="Smart playlists">
      <div className="flex items-center gap-1">
        <h3 className="flex-1 text-xs font-semibold">Smart playlists</h3>
        <Button
          size="sm"
          variant="text"
          onClick={() => setEditing({ id: null, definition: EMPTY_SMART })}
        >
          <PlusIcon size={14} aria-hidden />
          New smart playlist
        </Button>
      </div>
      {lists === null ? null : lists.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          Rules like “house, 120–128 BPM, rating 4+, not played in 30 days” keep
          themselves up to date.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {lists.map((list) => (
            <li
              key={list.id}
              className="border-border flex items-center gap-1 rounded-md border py-1 pr-1 pl-2"
            >
              <SparklesIcon size={14} className="opacity-60" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">
                  {list.name}
                </span>
                <span className="text-foreground-secondary truncate text-xs">
                  {counts[list.id] === undefined
                    ? '…'
                    : counts[list.id]! < 0
                      ? 'Rules need attention'
                      : `${counts[list.id]!.toLocaleString('en-US')} tracks now`}{' '}
                  · {describeRules(list)}
                </span>
              </span>
              {busyId === list.id ? (
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
                      aria-label={`Play ${list.name}`}
                      onClick={() =>
                        void run(
                          list.id,
                          () => playSmart(library, list.id, false),
                          'Could not play.',
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
                      aria-label={`Shuffle ${list.name}`}
                      onClick={() =>
                        void run(
                          list.id,
                          () => playSmart(library, list.id, true),
                          'Could not play.',
                        )
                      }
                    >
                      <ShuffleIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Save a fixed copy as a playlist" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Save a fixed copy of ${list.name}`}
                      onClick={() => setSnapshotOf(list)}
                    >
                      <CopyIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Edit rules" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Edit ${list.name}`}
                      onClick={() =>
                        setEditing({
                          id: list.id,
                          definition: definitionOf(list),
                        })
                      }
                    >
                      <PencilIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Delete" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      intent="danger"
                      aria-label={`Delete ${list.name}`}
                      onClick={() => setDeleting(list)}
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
      <SmartPlaylistDialog
        library={library}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => void load()}
      />
      <PlaylistNameDialog
        isOpen={snapshotOf !== null}
        title="Save a fixed copy (does not update)"
        confirmLabel="Save copy"
        initialName={snapshotOf ? `${snapshotOf.name} (snapshot)` : ''}
        onClose={() => setSnapshotOf(null)}
        onSubmit={async (name) => {
          if (!snapshotOf) {
            return;
          }
          const playlist = await library.analysis.smart.snapshot(
            snapshotOf.id,
            name,
          );
          toast.success(`Created “${playlist.name}”.`);
          onPlaylistCreated();
        }}
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete this smart playlist?"
        description={`“${deleting?.name ?? ''}” will be deleted. Only the rules go; your tracks and files are not touched.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) {
            void run(
              target.id,
              async () => {
                await library.analysis.smart.remove(target.id);
                toast.success(`Deleted “${target.name}”.`);
                await load();
              },
              'Could not delete.',
            );
          }
        }}
      />
    </section>
  );
}
