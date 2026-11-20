import { StarIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { Button, Dialog, Input, Loader, Tooltip } from '@tahti-player/ui';

import {
  TRACK_COLORS,
  type NativeUserDataSnapshot,
  type TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { TRACK_COLOR_CSS } from '../lib/trackColors';

const COLOR_NAME: Record<(typeof TRACK_COLORS)[number], ParseKeys<'web'>> = {
  red: 'trackOrganizeDialogBatch30.colorRed',
  orange: 'trackOrganizeDialogBatch30.colorOrange',
  yellow: 'trackOrganizeDialogBatch30.colorYellow',
  green: 'trackOrganizeDialogBatch30.colorGreen',
  blue: 'trackOrganizeDialogBatch30.colorBlue',
  purple: 'trackOrganizeDialogBatch30.colorPurple',
  gray: 'trackOrganizeDialogBatch30.colorGray',
};

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
  const { t } = useTranslation('web');
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
        failure instanceof Error
          ? failure.message
          : t('trackOrganizeDialogLeftovers.couldNotLoadLabels'),
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
          label: t('trackOrganizeDialogFields.undo'),
          onClick: () => {
            void library.catalog
              .restoreUserData(before)
              .then(() => {
                onChanged();
                return load();
              })
              .then(() => toast.success(i18n.t('web:toasts.undone')))
              .catch((failure) =>
                toast.error(
                  failure instanceof Error
                    ? failure.message
                    : t('trackOrganizeDialogBatch30.couldNotUndo'),
                ),
              );
          },
        },
      });
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('trackOrganizeDialogLeftovers.couldNotSave'),
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
    void run(
      t('trackOrganizeDialogBatch30.taggedTracks', {
        count: ids.length,
        n: ids.length.toLocaleString('en-US'),
        tag: trimmed,
      }),
      () => library.catalog.addTag(ids, trimmed),
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
      <Dialog.Title>{t('trackOrganize.rateAndLabel')}</Dialog.Title>
      <Dialog.Description>
        {t('trackOrganizeDialogBatch30.description', {
          count: ids.length,
          n: ids.length.toLocaleString('en-US'),
        })}
      </Dialog.Description>
      {!data ? (
        <p className="text-foreground-secondary flex items-center gap-2 text-sm">
          <Loader size="inline" shape="circle" />
          {t('trackOrganize.loading')}
        </p>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {currentRating === null
                ? t('trackOrganizeDialogBatch30.ratingMixed')
                : t('trackOrganizeDialogBatch30.rating')}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => (
                <Tooltip
                  key={stars}
                  content={t('trackOrganizeDialogBatch30.stars', {
                    count: stars,
                  })}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant={
                      currentRating !== null && stars <= currentRating
                        ? 'secondary'
                        : 'text'
                    }
                    disabled={busy}
                    aria-label={t('trackOrganizeDialogBatch30.stars', {
                      count: stars,
                    })}
                    onClick={() =>
                      void run(
                        t('trackOrganizeDialogBatch30.ratedTracks', {
                          count: ids.length,
                          n: ids.length.toLocaleString('en-US'),
                          stars,
                        }),
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
                </Tooltip>
              ))}
              <Button
                size="sm"
                variant="text"
                disabled={busy || currentRating === 0}
                onClick={() =>
                  void run(
                    t('trackOrganizeDialogBatch30.clearedRating', {
                      count: ids.length,
                      n: ids.length.toLocaleString('en-US'),
                    }),
                    () => library.catalog.setRating(ids, 0),
                  )
                }
              >
                {t('trackOrganize.clear')}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {currentColor === null
                ? t('trackOrganizeDialogBatch30.colorLabelMixed')
                : t('trackOrganizeDialogBatch30.colorLabel')}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {TRACK_COLORS.map((color) => (
                <Button
                  key={color}
                  size="sm"
                  variant={currentColor === color ? 'secondary' : 'text'}
                  disabled={busy}
                  aria-label={t('trackOrganizeDialogLabels.labelColor', {
                    color: t(COLOR_NAME[color]),
                  })}
                  aria-pressed={currentColor === color}
                  onClick={() =>
                    void run(
                      t('trackOrganizeDialogBatch30.labeledTracks', {
                        count: ids.length,
                        n: ids.length.toLocaleString('en-US'),
                        color: t(COLOR_NAME[color]),
                      }),
                      () => library.catalog.setColor(ids, color),
                    )
                  }
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ background: TRACK_COLOR_CSS[color] }}
                    aria-hidden
                  />
                  {t(COLOR_NAME[color])}
                </Button>
              ))}
              <Button
                size="sm"
                variant="text"
                disabled={busy || currentColor === ''}
                onClick={() =>
                  void run(
                    t('trackOrganizeDialogBatch30.removedLabel', {
                      count: ids.length,
                      n: ids.length.toLocaleString('en-US'),
                    }),
                    () => library.catalog.setColor(ids, ''),
                  )
                }
              >
                {t('trackOrganize.none')}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              {t('trackOrganize.tags')}
            </span>
            <div className="flex flex-wrap gap-1">
              {tagCounts.length === 0 ? (
                <span className="text-foreground-secondary text-xs">
                  {t('trackOrganizeDialogBatch30.noTags', {
                    count: ids.length,
                  })}
                </span>
              ) : null}
              {tagCounts.map(([name, count]) => (
                <Button
                  className="gap-1.5"
                  key={name}
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  aria-label={t('trackOrganizeDialogLabels.removeTagName', {
                    name,
                  })}
                  onClick={() =>
                    void run(
                      t('trackOrganizeDialogBatch30.removedTag', {
                        count: ids.length,
                        n: ids.length.toLocaleString('en-US'),
                        tag: name,
                      }),
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
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addTag(tagInput);
              }}
            >
              <div className="min-w-0 flex-1">
                <Input
                  enterKeyHint="done"
                  label={t('trackOrganize.addATag')}
                  value={tagInput}
                  disabled={busy}
                  onChange={(event) => setTagInput(event.target.value)}
                />
              </div>
              <Button disabled={busy || !tagInput.trim()} type="submit">
                {t('trackOrganizeDialogBatch30.add')}
              </Button>
            </form>
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
        <Dialog.Close>{t('trackOrganize.done')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
