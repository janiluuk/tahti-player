import { LoaderCircleIcon, Undo2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input } from '@tahti-player/ui';

import type {
  NativeEditField,
  NativeEditPreview,
  NativeFieldEdit,
  NativeFieldSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

const FIELDS: Array<{ field: NativeEditField; label: string }> = [
  { field: 'title', label: 'Title' },
  { field: 'artist', label: 'Artist' },
  { field: 'albumArtist', label: 'Album artist' },
  { field: 'album', label: 'Album' },
  { field: 'genre', label: 'Genre' },
  { field: 'year', label: 'Year' },
  { field: 'trackNo', label: 'Track #' },
  { field: 'discNo', label: 'Disc #' },
  { field: 'comment', label: 'Comment' },
];

const FIELD_LABEL = Object.fromEntries(
  FIELDS.map(({ field, label }) => [field, label]),
) as Record<NativeEditField, string>;

const plural = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  /** Catalog ids being edited (one row or a whole selection). */
  ids: string[];
  /** Called after the catalog changed (also after an undo). */
  onChanged: () => void;
};

/**
 * Edits tag fields for one or many tracks. Edits are stored apart from the
 * file's own tags (so a rescan keeps them and any field can be put back), and
 * nothing is written until "Apply", after a preview of what would change.
 * Files on disk are never modified.
 */
export function TrackEditorDialog({
  isOpen,
  onClose,
  library,
  ids,
  onChanged,
}: Props) {
  const [summary, setSummary] = useState<NativeFieldSummary[] | null>(null);
  // Only fields the user touched: a typed value, or `null` to revert to the file tag.
  const [draft, setDraft] = useState<
    Partial<Record<NativeEditField, string | null>>
  >({});
  const [preview, setPreview] = useState<NativeEditPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    setSummary(null);
    setDraft({});
    setPreview(null);
    setPreviewError(null);
    setLoadError(null);
    library.catalog
      .fieldSummary(ids)
      .then((value) => {
        if (!cancelled) {
          setSummary(value);
        }
      })
      .catch((failure) => {
        if (!cancelled) {
          setLoadError(
            failure instanceof Error ? failure.message : 'Could not load tags.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, ids, library]);

  const edits = useMemo<NativeFieldEdit[]>(
    () =>
      (Object.entries(draft) as Array<[NativeEditField, string | null]>).map(
        ([field, value]) => ({ field, value }),
      ),
    [draft],
  );

  // Preview is the real edit run and rolled back, so it also surfaces
  // validation problems (a year of "abc") before Apply.
  useEffect(() => {
    if (!isOpen || edits.length === 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      library.catalog
        .editPreview(ids, edits)
        .then((value) => {
          if (!cancelled) {
            setPreview(value);
            setPreviewError(null);
          }
        })
        .catch((failure) => {
          if (!cancelled) {
            setPreview(null);
            setPreviewError(
              failure instanceof Error ? failure.message : String(failure),
            );
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, ids, edits, library]);

  const close = () => {
    if (!busy) {
      onClose();
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const outcome = await library.catalog.editTracks(ids, edits);
      onChanged();
      onClose();
      toast.success(
        outcome.tracksChanged === 0
          ? 'Nothing needed changing.'
          : `Updated ${plural(outcome.tracksChanged, 'track')}.`,
        outcome.tracksChanged === 0
          ? undefined
          : {
              action: {
                label: 'Undo',
                onClick: () => {
                  void library.catalog
                    .restoreEdits(outcome.undo)
                    .then(() => {
                      onChanged();
                      toast.success('Edit undone.');
                    })
                    .catch((failure) =>
                      toast.error(
                        failure instanceof Error
                          ? failure.message
                          : 'Could not undo.',
                      ),
                    );
                },
              },
            },
      );
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not save the edit.',
      );
    } finally {
      setBusy(false);
    }
  };

  const summaryFor = (field: NativeEditField) =>
    summary?.find((item) => item.field === field);
  const canApply =
    edits.length > 0 &&
    !previewError &&
    (preview?.tracksChanged ?? 0) > 0 &&
    !busy;

  return (
    <Dialog.Root isOpen={isOpen} onClose={close} className="max-w-xl">
      <Dialog.Title>
        {ids.length === 1 ? 'Edit tags' : `Edit ${plural(ids.length, 'track')}`}
      </Dialog.Title>
      <Dialog.Description>
        Changes are kept in your library and survive rescans; the audio files
        are not modified. Leave a field alone to keep each track’s own value.
      </Dialog.Description>
      {loadError ? (
        <p role="alert" className="text-destructive text-sm">
          {loadError}
        </p>
      ) : !summary ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Loading…
        </p>
      ) : (
        <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
          {FIELDS.map(({ field, label }) => {
            const info = summaryFor(field);
            const mixed = (info?.distinct ?? 1) > 1;
            const reverting = draft[field] === null;
            const value =
              field in draft && draft[field] !== null
                ? (draft[field] as string)
                : reverting
                  ? ''
                  : mixed
                    ? ''
                    : (info?.value ?? '');
            return (
              <div key={field} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    label={label}
                    value={value}
                    disabled={reverting}
                    placeholder={
                      reverting
                        ? 'Will go back to the file’s tag'
                        : mixed
                          ? 'Mixed values'
                          : ''
                    }
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </div>
                {(info?.edited ?? 0) > 0 || field in draft ? (
                  <Button
                    size="sm"
                    variant="text"
                    aria-label={
                      field in draft
                        ? `Discard change to ${label}`
                        : `Put ${label} back to the file’s tag`
                    }
                    onClick={() =>
                      setDraft((current) => {
                        const next = { ...current };
                        if (field in current) {
                          delete next[field];
                        } else {
                          next[field] = null;
                        }
                        return next;
                      })
                    }
                  >
                    <Undo2Icon size={13} aria-hidden />
                    {field in draft
                      ? 'Discard'
                      : ids.length > 1
                        ? `Revert (${info?.edited})`
                        : 'Revert to file tag'}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {previewError ? (
        <p role="alert" className="text-destructive text-sm">
          {previewError}
        </p>
      ) : preview ? (
        <div className="text-muted-foreground flex flex-col gap-1 text-xs">
          <p>
            {preview.tracksChanged === 0
              ? 'No track would change.'
              : `${plural(preview.tracksChanged, 'track')} will change${
                  preview.tracksUnchanged > 0
                    ? `, ${preview.tracksUnchanged.toLocaleString('en-US')} already match`
                    : ''
                }.`}
          </p>
          {preview.examples.slice(0, 3).map((example) => (
            <p key={`${example.trackId}:${example.field}`} className="truncate">
              {example.title} — {FIELD_LABEL[example.field]}:{' '}
              {example.before || '(empty)'} → {example.after || '(empty)'}
            </p>
          ))}
        </div>
      ) : null}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button disabled={!canApply} onClick={() => void apply()}>
          {busy ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Apply
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
