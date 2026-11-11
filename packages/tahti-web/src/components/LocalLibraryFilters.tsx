import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, FilterChips, Input, Select } from '@tahti-player/ui';

import { keyInputError } from '../lib/musicalKey';
import {
  countActiveFilters,
  EMPTY_TRACK_FILTERS,
  TRACK_COLORS,
  type NativeAvailability,
  type NativeFilterOptions,
  type NativeLibraryRoot,
  type NativeTrackFilters,
} from '../lib/nativeLibrary';

const ANY_FOLDER = '__any__';
const ANY_TAG = '__any__';

function toNumber(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const text = (value: number | null) => (value === null ? '' : String(value));
const minutes = (seconds: number | null) =>
  seconds === null ? '' : String(Math.round((seconds / 60) * 100) / 100);

function folderName(path: string) {
  return (
    path
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() || path
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  filters: NativeTrackFilters;
  onApply: (filters: NativeTrackFilters) => void;
  options: NativeFilterOptions | null;
  roots: NativeLibraryRoot[];
  /** Tags in use, to offer as a filter. */
  tags?: Array<{ name: string; tracks: number }>;
};

/**
 * Range and attribute filters that combine with search and the browse group.
 * Edits are drafted and only applied on "Apply", so typing a year range does
 * not re-query per keystroke.
 */
export function LocalLibraryFilters({
  isOpen,
  onClose,
  filters,
  onApply,
  options,
  roots,
  tags = [],
}: Props) {
  const { t } = useTranslation('web');
  const [draft, setDraft] = useState(filters);
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);
  const set = (patch: Partial<NativeTrackFilters>) =>
    setDraft((current) => ({ ...current, ...patch }));

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Title>{t('localLibraryFilters.filterTracks')}</Dialog.Title>
      <Dialog.Description>
        {t('localLibraryFilters.narrowTheListByYear')}
      </Dialog.Description>
      <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            label={t('localLibraryFilters.yearFrom')}
            placeholder={options?.yearMin ? String(options.yearMin) : ''}
            value={text(draft.yearMin)}
            onChange={(event) => set({ yearMin: toNumber(event.target.value) })}
          />
          <Input
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            label={t('localLibraryFilters.yearTo')}
            placeholder={options?.yearMax ? String(options.yearMax) : ''}
            value={text(draft.yearMax)}
            onChange={(event) => set({ yearMax: toNumber(event.target.value) })}
          />
          <Input
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            label={t('localLibraryFilters.longerThanMinutes')}
            value={minutes(draft.durationMin)}
            onChange={(event) => {
              const value = toNumber(event.target.value);
              set({ durationMin: value === null ? null : value * 60 });
            }}
          />
          <Input
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            label={t('localLibraryFilters.shorterThanMinutes')}
            value={minutes(draft.durationMax)}
            onChange={(event) => {
              const value = toNumber(event.target.value);
              set({ durationMax: value === null ? null : value * 60 });
            }}
          />
          <Input
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            label={t('localLibraryFilters.bitrateAtLeastKbps')}
            value={text(draft.bitrateMin)}
            onChange={(event) =>
              set({ bitrateMin: toNumber(event.target.value) })
            }
          />
          <Input
            type="date"
            label={t('localLibraryFilters.addedSince')}
            value={draft.addedSince ?? ''}
            onChange={(event) =>
              set({ addedSince: event.target.value || null })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="decimal"
            enterKeyHint="done"
            label={t('localLibraryFilters.bpmFrom')}
            value={text(draft.bpmMin)}
            onChange={(event) => set({ bpmMin: toNumber(event.target.value) })}
          />
          <Input
            type="number"
            inputMode="decimal"
            enterKeyHint="done"
            label={t('localLibraryFilters.bpmTo')}
            value={text(draft.bpmMax)}
            onChange={(event) => set({ bpmMax: toNumber(event.target.value) })}
          />
          <Input
            autoCorrect="off"
            spellCheck={false}
            label={t('localLibraryFilters.keyEGAmF')}
            value={draft.key ?? ''}
            error={keyInputError(draft.key ?? '') ?? undefined}
            onChange={(event) =>
              set({ key: event.target.value.trim() || null })
            }
          />
          <Input
            type="number"
            inputMode="decimal"
            enterKeyHint="done"
            label={t('localLibraryFilters.louderThanLufs')}
            value={text(draft.loudnessMin)}
            onChange={(event) =>
              set({ loudnessMin: toNumber(event.target.value) })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" aria-hidden>
            {t('localLibraryFilters.analysis')}
          </span>
          <FilterChips
            aria-label={t('localLibraryFilters.analysis')}
            items={[
              { id: 'any', label: 'All' },
              { id: 'analyzed', label: t('localLibraryFiltersMore.analyzed') },
              {
                id: 'unanalyzed',
                label: t('localLibraryFiltersMore.notAnalyzed'),
              },
            ]}
            selected={draft.analysis ?? 'any'}
            onChange={(id) =>
              set({
                analysis:
                  id === 'any' ? null : (id as 'analyzed' | 'unanalyzed'),
              })
            }
          />
        </div>
        {options && options.formats.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium" aria-hidden>
              {t('localLibraryFilters.format')}
            </span>
            <FilterChips
              aria-label={t('localLibraryFilters.format')}
              multiple
              items={options.formats.map((format) => ({
                id: format,
                label: format.toUpperCase(),
              }))}
              selected={draft.formats}
              onChange={(formats) => set({ formats })}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" aria-hidden>
            {t('localLibraryFilters.availability')}
          </span>
          <FilterChips
            aria-label={t('localLibraryFilters.availability')}
            items={[
              { id: 'any', label: 'All' },
              {
                id: 'available',
                label: t('localLibraryFiltersMore.available'),
              },
              { id: 'missing', label: t('localLibraryFiltersMore.missing') },
            ]}
            selected={draft.availability ?? 'any'}
            onChange={(id) =>
              set({
                availability: id === 'any' ? null : (id as NativeAvailability),
              })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" aria-hidden>
            {t('localLibraryFilters.rating')}
          </span>
          <FilterChips
            aria-label={t('localLibraryFilters.rating')}
            items={[
              { id: '0', label: 'Any' },
              { id: '1', label: '★ 1+' },
              { id: '2', label: '★ 2+' },
              { id: '3', label: '★ 3+' },
              { id: '4', label: '★ 4+' },
              { id: '5', label: '★ 5' },
            ]}
            selected={String(draft.ratingMin ?? 0)}
            onChange={(id) =>
              set({ ratingMin: id === '0' ? null : Number(id) })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" aria-hidden>
            {t('localLibraryFilters.colorLabel')}
          </span>
          <FilterChips
            aria-label={t('localLibraryFilters.colorLabel')}
            items={[
              { id: 'any', label: 'Any' },
              ...TRACK_COLORS.map((color) => ({ id: color, label: color })),
            ]}
            selected={draft.color ?? 'any'}
            onChange={(id) => set({ color: id === 'any' ? null : id })}
          />
        </div>
        {tags.length > 0 || draft.tag ? (
          <Select
            label={t('localLibraryFiltersFields.tag')}
            value={draft.tag ?? ANY_TAG}
            onValueChange={(name) =>
              set({ tag: name === ANY_TAG ? null : name })
            }
            options={[
              { id: ANY_TAG, label: t('localLibraryFiltersMore.anyTag') },
              ...tags.map((tag) => ({
                id: tag.name,
                label: `${tag.name} (${tag.tracks})`,
              })),
            ]}
          />
        ) : null}
        {roots.length > 0 ? (
          <Select
            label={t('localLibraryFilters.watchedFolder')}
            value={draft.rootId ?? ANY_FOLDER}
            onValueChange={(id) =>
              set({ rootId: id === ANY_FOLDER ? null : id })
            }
            options={[
              { id: ANY_FOLDER, label: t('localLibraryFiltersMore.anyFolder') },
              ...roots.map((root) => ({
                id: root.id,
                label: folderName(root.path),
              })),
            ]}
          />
        ) : null}
      </div>
      <Dialog.Actions>
        <Button
          variant="text"
          disabled={countActiveFilters(draft) === 0}
          onClick={() => setDraft(EMPTY_TRACK_FILTERS)}
        >
          {t('localLibraryFilters.clearAll')}
        </Button>
        <Dialog.Close>{t('localLibraryFilters.cancel')}</Dialog.Close>
        <Button
          disabled={keyInputError(draft.key ?? '') !== null}
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          {t('localLibraryFilters.apply')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
