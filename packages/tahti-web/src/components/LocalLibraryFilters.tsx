import { useEffect, useState } from 'react';

import { Button, Dialog, FilterChips, Input, Select } from '@tahti-player/ui';

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
      <Dialog.Title>Filter tracks</Dialog.Title>
      <Dialog.Description>
        Narrow the list by year, length, format and more. Filters combine with
        search and the group you are browsing.
      </Dialog.Description>
      <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            label="Year from"
            placeholder={options?.yearMin ? String(options.yearMin) : ''}
            value={text(draft.yearMin)}
            onChange={(event) => set({ yearMin: toNumber(event.target.value) })}
          />
          <Input
            type="number"
            label="Year to"
            placeholder={options?.yearMax ? String(options.yearMax) : ''}
            value={text(draft.yearMax)}
            onChange={(event) => set({ yearMax: toNumber(event.target.value) })}
          />
          <Input
            type="number"
            label="Longer than (minutes)"
            value={minutes(draft.durationMin)}
            onChange={(event) => {
              const value = toNumber(event.target.value);
              set({ durationMin: value === null ? null : value * 60 });
            }}
          />
          <Input
            type="number"
            label="Shorter than (minutes)"
            value={minutes(draft.durationMax)}
            onChange={(event) => {
              const value = toNumber(event.target.value);
              set({ durationMax: value === null ? null : value * 60 });
            }}
          />
          <Input
            type="number"
            label="Bitrate at least (kbps)"
            value={text(draft.bitrateMin)}
            onChange={(event) =>
              set({ bitrateMin: toNumber(event.target.value) })
            }
          />
          <Input
            type="date"
            label="Added since"
            value={draft.addedSince ?? ''}
            onChange={(event) =>
              set({ addedSince: event.target.value || null })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            label="BPM from"
            value={text(draft.bpmMin)}
            onChange={(event) => set({ bpmMin: toNumber(event.target.value) })}
          />
          <Input
            type="number"
            label="BPM to"
            value={text(draft.bpmMax)}
            onChange={(event) => set({ bpmMax: toNumber(event.target.value) })}
          />
          <Input
            label="Key (e.g. Am, F#, 8A)"
            value={draft.key ?? ''}
            onChange={(event) =>
              set({ key: event.target.value.trim() || null })
            }
          />
          <Input
            type="number"
            label="Louder than (LUFS)"
            value={text(draft.loudnessMin)}
            onChange={(event) =>
              set({ loudnessMin: toNumber(event.target.value) })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Analysis</span>
          <FilterChips
            items={[
              { id: 'any', label: 'All' },
              { id: 'analyzed', label: 'Analyzed' },
              { id: 'unanalyzed', label: 'Not analyzed' },
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
            <span className="text-sm font-medium">Format</span>
            <FilterChips
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
          <span className="text-sm font-medium">Availability</span>
          <FilterChips
            items={[
              { id: 'any', label: 'All' },
              { id: 'available', label: 'Available' },
              { id: 'missing', label: 'Missing' },
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
          <span className="text-sm font-medium">Rating</span>
          <FilterChips
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
          <span className="text-sm font-medium">Color label</span>
          <FilterChips
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
            label="Tag"
            value={draft.tag ?? ANY_TAG}
            onValueChange={(name) =>
              set({ tag: name === ANY_TAG ? null : name })
            }
            options={[
              { id: ANY_TAG, label: 'Any tag' },
              ...tags.map((tag) => ({
                id: tag.name,
                label: `${tag.name} (${tag.tracks})`,
              })),
            ]}
          />
        ) : null}
        {roots.length > 0 ? (
          <Select
            label="Watched folder"
            value={draft.rootId ?? ANY_FOLDER}
            onValueChange={(id) =>
              set({ rootId: id === ANY_FOLDER ? null : id })
            }
            options={[
              { id: ANY_FOLDER, label: 'Any folder' },
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
          Clear all
        </Button>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          Apply
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
