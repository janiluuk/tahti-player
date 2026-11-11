import { Undo2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  InlineError,
  InlineLoader,
  Input,
  Loader,
} from '@tahti-player/ui';

import type {
  NativeEditField,
  NativeEditPreview,
  NativeFieldEdit,
  NativeFieldSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { webT } from '../lib/webT';

function fields(
  t: TFunction<'web'>,
): Array<{ field: NativeEditField; label: string }> {
  return [
    { field: 'title', label: t('trackEditorDialogMore.title') },
    { field: 'artist', label: t('trackEditorDialogMore.artist') },
    { field: 'albumArtist', label: t('trackEditorDialogMore.albumArtist') },
    { field: 'album', label: t('trackEditorDialogMore.album') },
    { field: 'genre', label: t('trackEditorDialogMore.genre') },
    { field: 'composer', label: t('trackEditorDialogMore.composer') },
    { field: 'year', label: t('trackEditorDialogMore.year') },
    { field: 'trackNo', label: t('trackEditorDialogMore.track') },
    { field: 'discNo', label: t('trackEditorDialogMore.disc') },
    { field: 'comment', label: t('trackEditorDialogMore.comment') },
  ];
}

function fieldLabels(t: TFunction<'web'>): Record<NativeEditField, string> {
  return Object.fromEntries(
    fields(t).map(({ field, label }) => [field, label]),
  ) as Record<NativeEditField, string>;
}

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
  const { t } = useTranslation('web');
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
            failure instanceof Error
              ? failure.message
              : t('trackEditorDialogLeftovers.couldNotLoadTags'),
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
                label: t('trackEditorDialogFields.undo'),
                onClick: () => {
                  void library.catalog
                    .restoreEdits(outcome.undo)
                    .then(() => {
                      onChanged();
                      toast.success(i18n.t('web:toasts.editUndone'));
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
        failure instanceof Error
          ? failure.message
          : t('trackEditorDialogLeftovers.couldNotSaveEdit'),
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
        {ids.length === 1
          ? 'Edit tags'
          : webT()('a11yNamed.edit', { name: plural(ids.length, 'track') })}
      </Dialog.Title>
      <Dialog.Description>
        {t('trackEditorDialog.changesAreKeptInYour')}
      </Dialog.Description>
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          void apply();
        }}
      >
        {loadError ? (
          <InlineError>{loadError}</InlineError>
        ) : !summary ? (
          <InlineLoader label={t('trackEditorDialog.loading')} />
        ) : (
          <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
            {fields(t).map(({ field, label }) => {
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
                      className="gap-1.5"
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
          <InlineError>{previewError}</InlineError>
        ) : preview ? (
          <div className="text-foreground-secondary flex flex-col gap-1 text-xs">
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
              <p
                key={`${example.trackId}:${example.field}`}
                className="truncate"
              >
                {example.title} — {fieldLabels(t)[example.field]}:{' '}
                {example.before || '(empty)'} → {example.after || '(empty)'}
              </p>
            ))}
          </div>
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>{t('trackEditorDialog.cancel')}</Dialog.Close>
          <Button className="gap-1.5" disabled={!canApply} type="submit">
            {busy ? <Loader size="inline" shape="circle" /> : null}
            Apply
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
