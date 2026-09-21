import { useEffect, useState } from 'react';

import { Button, Dialog, FilterChips, Input, Select } from '@tahti-player/ui';

import {
  countActiveFilters,
  EMPTY_TRACK_FILTERS,
  type NativeAvailability,
  type NativeFilterOptions,
  type NativeLibraryRoot,
  type NativeTrackFilters,
} from '../lib/nativeLibrary';

const ANY_FOLDER = '__any__';

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
