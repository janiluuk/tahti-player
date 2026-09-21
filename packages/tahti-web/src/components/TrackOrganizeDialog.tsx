import { LoaderCircleIcon, StarIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input } from '@tahti-player/ui';

import {
  TRACK_COLORS,
  type NativeUserDataSnapshot,
  type TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { TRACK_COLOR_CSS } from '../lib/trackColors';

const plural = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  ids: string[];
  /** Called after the catalog changed (also after an undo). */
  onChanged: () => void;
};

/**
 * Rating, color label and tags for one or many tracks. Every change applies
 * at once (these are quick, reversible marks) and offers Undo.
 */
export function TrackOrganizeDialog({
  isOpen,
  onClose,
  library,
  ids,
  onChanged,
}: Props) {
  const [data, setData] = useState<NativeUserDataSnapshot[] | null>(null);
  const [known, setKnown] = useState<Array<{ name: string; tracks: number }>>(
    [],
  );
  const [tagInput, setTagInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [rows, tags] = await Promise.all([
      library.catalog.userData(ids),
      library.catalog.listTags(),
    ]);
    setData(rows);
    setKnown(tags);
  }, [ids, library]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setData(null);
    setTagInput('');
    load().catch((failure) =>
      toast.error(
        failure instanceof Error ? failure.message : 'Could not load labels.',
      ),
    );
  }, [isOpen, load]);

  const ratings = useMemo(
    () => new Set(data?.map((row) => row.rating)),
    [data],
  );
  const colors = useMemo(() => new Set(data?.map((row) => row.color)), [data]);
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      for (const tag of row.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const run = async (
    label: string,
    action: () => Promise<NativeUserDataSnapshot[]>,
  ) => {
    setBusy(true);
    try {
      const before = await action();
      onChanged();
      await load();
      toast.success(label, {
        action: {
          label: 'Undo',
          onClick: () => {
            void library.catalog
              .restoreUserData(before)
              .then(() => {
                onChanged();
                return load();
              })
              .then(() => toast.success('Undone.'))
              .catch((failure) =>
                toast.error(
                  failure instanceof Error
                    ? failure.message
                    : 'Could not undo.',
                ),
              );
          },
        },
      });
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not save.',
      );
    } finally {
      setBusy(false);
    }
  };

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setTagInput('');
    void run(`Tagged ${plural(ids.length, 'track')} “${trimmed}”.`, () =>
      library.catalog.addTag(ids, trimmed),
    );
  };

  const currentRating = ratings.size === 1 ? [...ratings][0] : null;
  const currentColor = colors.size === 1 ? [...colors][0] : null;

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => (busy ? undefined : onClose())}
      className="max-w-md"
    >
      <Dialog.Title>Rate and label</Dialog.Title>
      <Dialog.Description>
        {plural(ids.length, 'track')}. Ratings, labels and tags stay in your
        library; they never change the audio files.
      </Dialog.Description>
      {!data ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Loading…
        </p>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Rating{currentRating === null ? ' (mixed)' : ''}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => (
                <Button
                  key={stars}
                  size="icon-sm"
                  variant={
                    currentRating !== null && stars <= currentRating
                      ? 'secondary'
                      : 'text'
                  }
                  disabled={busy}
                  aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'}`}
                  onClick={() =>
                    void run(
                      `Rated ${plural(ids.length, 'track')} ${stars} of 5.`,
                      () => library.catalog.setRating(ids, stars),
                    )
                  }
                >
                  <StarIcon
                    size={16}
                    aria-hidden
                    fill={
                      currentRating !== null && stars <= currentRating
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                </Button>
              ))}
              <Button
                size="sm"
                variant="text"
                disabled={busy || currentRating === 0}
                onClick={() =>
                  void run(
                    `Cleared the rating of ${plural(ids.length, 'track')}.`,
                    () => library.catalog.setRating(ids, 0),
                  )
                }
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Color label{currentColor === null ? ' (mixed)' : ''}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {TRACK_COLORS.map((color) => (
                <Button
                  key={color}
                  size="sm"
                  variant={currentColor === color ? 'secondary' : 'text'}
                  disabled={busy}
                  aria-label={`Label ${color}`}
                  aria-pressed={currentColor === color}
                  onClick={() =>
                    void run(
                      `Labeled ${plural(ids.length, 'track')} ${color}.`,
                      () => library.catalog.setColor(ids, color),
                    )
                  }
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ background: TRACK_COLOR_CSS[color] }}
                    aria-hidden
                  />
                  {color}
                </Button>
              ))}
              <Button
                size="sm"
                variant="text"
                disabled={busy || currentColor === ''}
                onClick={() =>
                  void run(
                    `Removed the label from ${plural(ids.length, 'track')}.`,
                    () => library.catalog.setColor(ids, ''),
                  )
                }
              >
                None
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tags</span>
            <div className="flex flex-wrap gap-1">
              {tagCounts.length === 0 ? (
                <span className="text-muted-foreground text-xs">
                  No tags on {ids.length === 1 ? 'this track' : 'these tracks'}.
                </span>
              ) : null}
              {tagCounts.map(([name, count]) => (
                <Button
                  key={name}
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  aria-label={`Remove tag ${name}`}
                  onClick={() =>
                    void run(
                      `Removed “${name}” from ${plural(ids.length, 'track')}.`,
                      () => library.catalog.removeTag(ids, name),
                    )
                  }
                >
                  {name}
                  {ids.length > 1 ? ` (${count}/${ids.length})` : ''}
                  <XIcon size={12} aria-hidden />
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  label="Add a tag"
                  value={tagInput}
                  disabled={busy}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                />
              </div>
              <Button
                disabled={busy || !tagInput.trim()}
                onClick={() => addTag(tagInput)}
              >
                Add
              </Button>
            </div>
            {known.filter(
              (tag) => !tagCounts.some(([name]) => name === tag.name),
            ).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {known
                  .filter(
                    (tag) => !tagCounts.some(([name]) => name === tag.name),
                  )
                  .slice(0, 12)
                  .map((tag) => (
                    <Button
                      key={tag.name}
                      size="sm"
                      variant="text"
                      disabled={busy}
                      onClick={() => addTag(tag.name)}
                    >
                      + {tag.name}
                    </Button>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
      <Dialog.Actions>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
